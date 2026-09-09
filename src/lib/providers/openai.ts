import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { getProviderApiKey } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { log, type LogContext } from "@/lib/log";

const MODEL = "gpt-5.5";
const TIMEOUT_MS = 75_000;

let client: OpenAI | undefined;

function getOpenAiClient(): OpenAI {
  client ??= new OpenAI({
    apiKey: getProviderApiKey("OPENAI_API_KEY"),
    maxRetries: 1,
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
): Promise<z.output<Schema>> {
  const client = getOpenAiClient();
  const startedAt = performance.now();

  try {
    const response = await client.responses.parse({
      model: MODEL,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: instructions },
        { role: "user", content: input },
      ],
      text: {
        format: zodTextFormat(schema, schemaName),
      },
    });

    if (response.output_parsed === null) {
      throw new AppError("analysis_failed", "AI가 분석 결과 생성을 거부했거나 완료하지 못했다.");
    }

    log.info("openai.response", context, {
      model: MODEL,
      durationMs: Math.round(performance.now() - startedAt),
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    });

    return schema.parse(response.output_parsed);
  } catch (error) {
    log.error("openai.error", context, {
      model: MODEL,
      durationMs: Math.round(performance.now() - startedAt),
    });

    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof OpenAI.APIError && error.status === 429) {
      throw new AppError("analysis_failed", "AI 사용량 한도를 초과했다.");
    }

    throw new AppError("analysis_failed", "AI가 수집된 사이트 정보를 분석하지 못했다.");
  }
}
