import { z } from "zod";

const envSchema = z.object({
  BETTER_AUTH_SECRET: z.string().describe("Better auth secret key"),
  GITHUB_CLIENT_ID: z.string().describe("Client id of the Github"),
  GITHUB_CLIENT_SECRET: z.string().describe("Client secret fo the Github"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
