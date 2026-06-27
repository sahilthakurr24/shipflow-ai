import { getGithubApp } from "@repo/services/clients/github";

export async function isSignatureValid(payload: string, signature: string | undefined) {
  if (!signature) {
    return false;
  }

  const app = await getGithubApp();
  return app.webhooks.verify(payload, signature);
}
