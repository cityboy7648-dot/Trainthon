import { Firecrawl, JobTimeoutError, SdkError, type Document } from "firecrawl";
import { getProviderApiKey } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { log, type LogContext } from "@/lib/log";
import type { CollectedPage, CollectedSite } from "@/lib/types";

const MAX_PAGES = 100;
const REQUEST_TIMEOUT_MS = 60_000;
const CRAWL_TIMEOUT_SECONDS = 120;

let client: Firecrawl | undefined;

function getFirecrawlClient(): Firecrawl {
  client ??= new Firecrawl({
    apiKey: getProviderApiKey("FIRECRAWL_API_KEY"),
    maxRetries: 1,
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  return client;
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

async function collectHomepage(url: string): Promise<Document> {
  const client = getFirecrawlClient();
  const homepage = await client.scrape(url, {
    formats: ["markdown", "links", "images", "branding"],
    onlyMainContent: false,
    blockAds: true,
    timeout: REQUEST_TIMEOUT_MS,
  });

  if (!homepage.markdown || !homepage.metadata?.scrapeId) {
    throw new AppError("analysis_failed", "사이트의 첫 페이지를 읽지 못했다.");
  }

  return homepage;
}

async function collectInteractiveEvidence(url: string, prompt: string): Promise<string> {
  const client = getFirecrawlClient();
  const listing = await client.scrape(url, {
    formats: ["markdown", "links", "images"],
    onlyMainContent: false,
    blockAds: true,
    timeout: REQUEST_TIMEOUT_MS,
  });
  const scrapeId = listing.metadata?.scrapeId;

  if (!scrapeId) {
    throw new AppError("analysis_failed", "동적 제품 목록을 확인할 브라우저 세션이 없다.");
  }

  try {
    const interaction = await client.interact(scrapeId, {
      prompt,
      timeout: 60,
      origin: "trainthon-brand-analysis",
    });

    const output = interaction.output ?? interaction.result ?? interaction.stdout;

    if (!interaction.success || !output) {
      throw new AppError(
        "analysis_failed",
        interaction.killed
          ? "동적 제품 목록 확인 시간이 초과됐다."
          : "동적 제품 목록의 끝을 확인하지 못했다.",
      );
    }

    return output;
  } finally {
    await client.stopInteraction(scrapeId);
  }
}

async function collectDynamicCatalog(url: string): Promise<string> {
  return collectInteractiveEvidence(
    url,
    "Stay on this website. Inspect this product or service listing only. Follow pagination, click load-more controls, and scroll until no new item appears. Return every distinct current product or service name, displayed price, description, image URL, and source page URL. Exclude blog, news, careers, legal pages, discontinued archives, and option-only duplicates. State explicitly whether the end of the list was reached.",
  );
}

async function collectBrowserProfile(url: string): Promise<string> {
  return collectInteractiveEvidence(
    url,
    "Inspect only the public entity, brand, store, or place represented by this page. Open its relevant overview, product, service, pricing, or menu tabs and scroll each relevant list until no new item appears. Return the entity name, category, description, representative image or logo URLs, and every distinct current product, service, plan, or menu item with its displayed price, description, and image URL. Ignore the surrounding directory, map, marketplace, or platform brand and its global navigation. State explicitly whether every relevant list reached its end.",
  );
}

export async function collectSite(url: string, context: LogContext): Promise<CollectedSite> {
  const client = getFirecrawlClient();
  const startedAt = performance.now();

  try {
    const homepage = await collectHomepage(url);
    const crawl = await client.crawl(url, {
      prompt:
        "Crawl the homepage and every current product or service listing, category, pagination, pricing, and detail page. Exclude blog, news, careers, legal, account, cart, checkout, and discontinued archive pages.",
      sitemap: "include",
      ignoreQueryParameters: false,
      deduplicateSimilarURLs: true,
      limit: MAX_PAGES,
      crawlEntireDomain: false,
      allowExternalLinks: false,
      allowSubdomains: false,
      scrapeOptions: {
        formats: ["markdown", "links", "images"],
        onlyMainContent: true,
        blockAds: true,
        timeout: REQUEST_TIMEOUT_MS,
      },
      timeout: CRAWL_TIMEOUT_SECONDS,
    });

    if (crawl.status !== "completed") {
      throw new AppError("analysis_failed", "사이트 전체 탐색 작업이 완료되지 않았다.");
    }

    const crawlErrors = await client.getCrawlErrors(crawl.id);
    const browserFallbackRequired =
      crawl.data.length === 0 &&
      crawlErrors.errors.length > 0 &&
      crawlErrors.errors.every((error) => error.code === "CRAWL_DENIAL");
    let dynamicCatalog: string | undefined;

    if (crawlErrors.robotsBlocked.length > 0) {
      throw new AppError(
        "analysis_failed",
        `robots.txt가 ${crawlErrors.robotsBlocked.length}개 페이지 수집을 차단했다.`,
      );
    }

    if (crawlErrors.errors.length > 0) {
      if (browserFallbackRequired) {
        dynamicCatalog = await collectBrowserProfile(url);
      } else {
        throw new AppError(
          "analysis_failed",
          `${crawlErrors.errors.length}개 페이지를 읽지 못해 전체 목록을 확인할 수 없다.`,
        );
      }
    }

    if (crawl.data.length >= MAX_PAGES || crawl.next) {
      throw new AppError(
        "analysis_failed",
        `사이트가 안전 수집 한도 ${MAX_PAGES}페이지를 넘어 전체 목록을 확인할 수 없다.`,
      );
    }

    const homepagePage = toCollectedPage(homepage);
    const pagesByUrl = new Map<string, CollectedPage>();

    if (homepagePage) {
      pagesByUrl.set(homepagePage.url, homepagePage);
    }

    for (const document of crawl.data) {
      const page = toCollectedPage(document);

      if (page) {
        pagesByUrl.set(page.url, page);
      }
    }

    if (pagesByUrl.size === 0) {
      throw new AppError("analysis_failed", "분석할 사이트 내용을 찾지 못했다.");
    }

    const pages = [...pagesByUrl.values()];
    const dynamicListing = pages.find((page) =>
      /\b(load more|show more|view more|infinite scroll)\b|더\s*보기/iu.test(page.markdown),
    );
    dynamicCatalog ??= dynamicListing
      ? await collectDynamicCatalog(dynamicListing.url)
      : "수집된 목록에서 더 보기 또는 무한 스크롤 제어를 찾지 못했다. 사이트 크롤 작업은 완료됐다.";

    log.info("firecrawl.complete", context, {
      durationMs: Math.round(performance.now() - startedAt),
      pages: pagesByUrl.size,
      creditsUsed: crawl.creditsUsed,
    });

    return {
      branding: homepage.branding ?? null,
      pages,
      dynamicCatalog,
    };
  } catch (error) {
    log.error("firecrawl.error", context, {
      durationMs: Math.round(performance.now() - startedAt),
    });

    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof JobTimeoutError) {
      throw new AppError("analysis_failed", "사이트 전체 탐색 시간이 초과됐다.");
    }

    if (error instanceof SdkError) {
      if (error.status === 401 || error.status === 403) {
        throw new AppError("analysis_failed", "사이트 수집 API 인증에 실패했다.");
      }
      if (error.status === 402 || error.status === 429) {
        throw new AppError("analysis_failed", "사이트 수집 API 사용량 한도를 초과했다.");
      }
    }

    throw new AppError("analysis_failed", "사이트를 수집하지 못했다.");
  }
}
