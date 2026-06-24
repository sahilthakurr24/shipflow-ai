import { openai } from "@inngest/agent-kit";
import { env } from "./env";

export const gpt4oMiniModel: ReturnType<typeof openai> = openai({
  model: "gpt-4o-mini",
  apiKey: env.OPENAI_API_KEY,
});
