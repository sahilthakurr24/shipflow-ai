import { z } from "zod";

const envSchema = z.object({
  GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
  GOOGLE_OAUTH_REDIRECT_URI: z.string().optional(),
  GITHUB_APP_ID: z.string().describe("GitHub App id"),
  GITHUB_APP_NAME: z.string().describe("GitHub App slug, used to build the install URL"),
  GITHUB_APP_PRIVATE_KEY: z
    .string()
    .describe("GitHub App private key (PEM, newlines escaped as \\n)"),
  GITHUB_WEBHOOK_SECRET: z.string().describe("Secret used to verify inbound GitHub webhooks"),
  RAZORPAY_KEY_ID: z.string().describe("Razorpay API key id (test mode: rzp_test_...)"),
  RAZORPAY_KEY_SECRET: z.string().describe("Razorpay API key secret"),
  RAZORPAY_WEBHOOK_SECRET: z.string().describe("Secret used to verify inbound Razorpay webhooks"),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
