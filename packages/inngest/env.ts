import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional().describe("API key for OpenAI"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
