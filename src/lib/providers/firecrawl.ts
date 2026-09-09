import { Firecrawl, JobTimeoutError, SdkError, type Document } from "firecrawl";
import { listingUrlsFromLinks } from "@/lib/agents/brand-analysis/listing-urls";
import { copy } from "@/lib/copy";
import { getProviderApiKey } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { log, type LogContext } from "@/lib/log";
import type { CollectedPage, CollectedSite } from "@/lib/types";

const MAX_LISTING_PAGES = 2;
const REQUEST_TIMEOUT_MS = 60_000;
const HOMEPAGE_WAIT_MS = 3_000;
const LISTING_WAIT_MS = 1_000;
const RATE_LIMIT_RETRY_CAP_MS = 60_000;

let client: Firecrawl | undefined;
let scrapeQueue: Promise<unknown> = Promise.resolve();

function getFirecrawlClient(): Firecrawl {
  client ??= new Firecrawl({
    apiKey: getProviderApiKey("FIRECRAWL_API_KEY"),
    maxRetries: 0,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  return client;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryAfterMs(error: unknown): number | null {
  const rateLimited =
    (error instanceof SdkError && error.status === 429) ||
    (error instanceof Error && /rate limit exceeded/i.test(error.message));

  if (!rateLimited) {
    return null;
  }

  const seconds = error instanceof Error ? error.message.match(/retry after (\d+)/i)?.[1] : null;
  return Math.min(RATE_LIMIT_RETRY_CAP_MS, Number(seconds ?? 20) * 1_000);
}

function collectFailure(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof JobTimeoutError) {
    return new AppError("analysis_failed", copy.brandAnalysis.collectTimeout);
  }

  if (error instanceof SdkError) {
    if (error.status === 401 || error.status === 403) {
      return new AppError("analysis_failed", copy.brandAnalysis.collectAuthFailed);
    }
    if (error.status === 402) {
      return new AppError("analysis_failed", copy.brandAnalysis.collectCreditsExhausted);
    }
    if (error.status === 429) {
      return new AppError("analysis_failed", copy.brandAnalysis.collectRateLimited);
    }
  }

  if (error instanceof Error && /rate limit exceeded/i.test(error.message)) {
    return new AppError("analysis_failed", copy.brandAnalysis.collectRateLimited);
  }

  if (error instanceof Error && /timeout|ETIMEDOUT/i.test(error.message)) {
    return new AppError("analysis_failed", copy.brandAnalysis.collectTimeout);
  }

  return new AppError("analysis_failed", copy.brandAnalysis.collectUnavailable);
}

function toCollectedPage(document: Document): CollectedPage | null {
  const url = document.metadata?.sourceURL ?? document.metadata?.url;

  if (!url || !document.markdown) {
    return null;
  }

  return {
    url,
    title: document.metadata?.title ?? null,
    markdown: document.markdown,
    links: document.links ?? [],
    images: document.images ?? [],
  };
}

async function scrapeOnce(
  url: string,
  waitFor: number,
  formats: Array<"markdown" | "links" | "images" | "branding">,
): Promise<Document> {
  return getFirecrawlClient().scrape(url, {
    formats,
    onlyMainContent: false,
    blockAds: true,
    waitFor,
    timeout: REQUEST_TIMEOUT_MS,
  });
}

async function scrapeDocument(
  url: string,
  waitFor: number,
  formats: Array<"markdown" | "links" | "images" | "branding">,
): Promise<Document> {
  const run = async () => {
    try {
      return await scrapeOnce(url, waitFor, formats);
    } catch (error) {
      const wait = retryAfterMs(error);
      if (wait === null) {
        throw error;
      }
      await sleep(wait);
      return scrapeOnce(url, waitFor, formats);
    }
  };

  const queued = scrapeQueue.then(run, run);
  scrapeQueue = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
}

async function addListingPages(
  pagesByUrl: Map<string, CollectedPage>,
  listingUrls: string[],
): Promise<void> {
  for (const listingUrl of listingUrls) {
    try {
      const page = toCollectedPage(
        await scrapeDocument(listingUrl, LISTING_WAIT_MS, ["markdown", "links", "images"]),
      );

      if (page) {
        pagesByUrl.set(page.url, page);
      }
    } catch {
      // 목록 한 페이지 실패가 전체 분석을 막지 않는다.
      continue;
    }
  }
}

export async function collectSite(url: string, context: LogContext): Promise<CollectedSite> {
  const startedAt = performance.now();

  try {
    const homepage = await scrapeDocument(url, HOMEPAGE_WAIT_MS, [
      "markdown",
      "links",
      "images",
      "branding",
    ]);
    const homepagePage = toCollectedPage(homepage);

    if (!homepagePage) {
      throw new AppError("analysis_failed", copy.brandAnalysis.homepageFailed);
    }

    const pagesByUrl = new Map<string, CollectedPage>([[homepagePage.url, homepagePage]]);
    await addListingPages(
      pagesByUrl,
      listingUrlsFromLinks(homepagePage.links, url, MAX_LISTING_PAGES),
    );

    log.info("firecrawl.complete", context, {
      durationMs: Math.round(performance.now() - startedAt),
      pages: pagesByUrl.size,
    });

    return {
      branding: homepage.branding ?? null,
      pages: [...pagesByUrl.values()],
      dynamicCatalog:
        "홈과 연결된 목록 페이지만 읽었다. 사이트 전체 크롤과 동적 목록 확인은 하지 않았다.",
    };
  } catch (error) {
    log.error("firecrawl.error", context, {
      durationMs: Math.round(performance.now() - startedAt),
      cause: error instanceof Error ? error.message.slice(0, 180) : "unknown",
    });
    throw collectFailure(error);
  }
}
