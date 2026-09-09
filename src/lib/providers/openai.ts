import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { getProviderApiKey } from "@/lib/env";
import { copy } from "@/lib/copy";
import { AppError, campaignErrors } from "@/lib/errors";
import { log, type LogContext } from "@/lib/log";
import type { TokenUsage, CampaignImageTiming } from "@/lib/types";

const MODEL = "gpt-5.5";
const IMAGE_MODEL = "gpt-image-2";
const TIMEOUT_MS = 75_000;
const IMAGE_TIMEOUT_MS = 180_000;
const IMAGES_PER_MINUTE = 5;
const IMAGE_WINDOW_MS = 61_000;
const RUN_IMAGE_BUDGET_MS = 280_000;

let client: OpenAI | undefined;

function getOpenAiClient(): OpenAI {
  client ??= new OpenAI({
    apiKey: getProviderApiKey("OPENAI_API_KEY"),
    maxRetries: 0,
    timeout: TIMEOUT_MS,
  });

  return client;
}

export async function parseStructuredOutput<Schema extends z.ZodType>(
  schema: Schema,
  schemaName: string,
  instructions: string,
  input: string,
  context: LogContext,
  imageUrls: string[] = [],
): Promise<{ output: z.output<Schema>; usage: TokenUsage }> {
  const client = getOpenAiClient();
  const startedAt = performance.now();

  try {
    const response = await client.responses.parse({
      model: MODEL,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: instructions },
        {
          role: "user",
          content: [
            { type: "input_text", text: input },
            ...imageUrls.map((image_url) => ({
              type: "input_image" as const,
              image_url,
              detail: "low" as const,
            })),
          ],
        },
      ],
      text: {
        format: zodTextFormat(schema, schemaName),
      },
    });

    if (response.output_parsed === null) {
      throw new AppError("analysis_failed", "AI가 분석 결과 생성을 거부했거나 완료하지 못했다.");
    }

    const usage: TokenUsage = {
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      calls: 1,
    };

    log.info("openai.response", context, {
      model: MODEL,
      durationMs: Math.round(performance.now() - startedAt),
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
    });

    return { output: schema.parse(response.output_parsed), usage };
  } catch (error) {
    log.error("openai.error", context, {
      model: MODEL,
      durationMs: Math.round(performance.now() - startedAt),
    });

    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof OpenAI.APIError && error.status === 429) {
      throw new AppError("analysis_failed", copy.brandAnalysis.aiRateLimited);
    }

    throw new AppError("analysis_failed", "AI가 수집된 사이트 정보를 분석하지 못했다.");
  }
}

export async function generateCampaignImage(
  prompt: string,
  imageUrls: string[],
  format: boolean | "pinterest",
  context: LogContext,
  timing: CampaignImageTiming,
): Promise<Buffer> {
  if (!context.runId || !context.assetId)
    throw new AppError("generation_failed", campaignErrors.create);
  const startedAt = performance.now();
  try {
    const scheduledAt =
      timing.imagesStartedAt + Math.floor(timing.index / IMAGES_PER_MINUTE) * IMAGE_WINDOW_MS;
    const delay = scheduledAt - Date.now();
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    const timeout = Math.min(
      IMAGE_TIMEOUT_MS,
      timing.runStartedAt + RUN_IMAGE_BUDGET_MS - Date.now(),
    );
    if (timeout < 30_000) throw new AppError("generation_failed", campaignErrors.timeout);
    const response = await getOpenAiClient().responses.create(
      {
        model: MODEL,
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              ...imageUrls.map((image_url) => ({
                type: "input_image" as const,
                image_url,
                detail: "high" as const,
              })),
            ],
          },
        ],
        tools: [
          {
            type: "image_generation",
            model: IMAGE_MODEL,
            quality: "high",
            size: format === "pinterest" ? "1024x1536" : format ? "1152x2048" : "1024x1280",
            output_format: "png",
          },
        ],
        tool_choice: { type: "image_generation" },
      },
      { timeout },
    );
    const result = response.output.find((item) => item.type === "image_generation_call");
    if (!result || result.type !== "image_generation_call" || !result.result) {
      throw new AppError("generation_failed", campaignErrors.image);
    }
    log.info("campaign.image", context, {
      model: IMAGE_MODEL,
      durationMs: Math.round(performance.now() - startedAt),
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    });
    return Buffer.from(result.result, "base64");
  } catch (error) {
    log.error("campaign.image_failed", context, {
      model: IMAGE_MODEL,
      durationMs: Math.round(performance.now() - startedAt),
      errorType: error instanceof Error ? error.name : "UnknownError",
      status: error instanceof OpenAI.APIError ? error.status : undefined,
      code: error instanceof OpenAI.APIError ? error.code : undefined,
    });
    if (error instanceof AppError) throw error;
    if (error instanceof OpenAI.APIConnectionTimeoutError)
      throw new AppError("generation_failed", campaignErrors.imageTimeout);
    if (
      error instanceof OpenAI.APIError &&
      (error.code === "insufficient_quota" || error.code === "billing_hard_limit_reached")
    )
      throw new AppError("generation_failed", campaignErrors.imageQuota);
    throw new AppError(
      "generation_failed",
      error instanceof OpenAI.APIError && error.status === 429
        ? campaignErrors.imageRateLimited
        : campaignErrors.image,
    );
  }
}
