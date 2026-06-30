import { openai } from "@inngest/agent-kit";
import { env } from "./env";

export const CODE_REVIEW_MODEL = "gpt-4o-mini";

export const gpt4oMiniModel: ReturnType<typeof openai> = openai({
  model: CODE_REVIEW_MODEL,
  apiKey: env.OPENAI_API_KEY,
});
