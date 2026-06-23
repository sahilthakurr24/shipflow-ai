import { z } from "zod";

const envSchema = z.object({
    BETTER_AUTH_SECRET : z.string().describe('Better auth secret key')
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
