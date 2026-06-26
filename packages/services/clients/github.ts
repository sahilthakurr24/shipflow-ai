// Type-only import is erased at runtime, so it does not `require` the ESM-only
// package — it just gives us a nameable return type (avoids TS2742).
import type { App } from "octokit";
import { env } from "../env";

// `octokit` v5 is ESM-only. This package is CommonJS, so it cannot `require` it
// statically — instead we load it via dynamic import() (works from CJS, loads ESM)
// and cache the constructed App on a single promise.
let appPromise: Promise<App> | null = null;

async function createGithubApp(): Promise<App> {
  const { App: GithubApp } = await import("octokit");
  return new GithubApp({
    appId: env.GITHUB_APP_ID,
    privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
    webhooks: {
      secret: env.GITHUB_WEBHOOK_SECRET,
    },
  });
}

export function getGithubApp(): Promise<App> {
  if (!appPromise) {
    appPromise = createGithubApp();
  }
  return appPromise;
}

export function getGithubInstallUrl(state?: string) {
  const url = new URL(`https://github.com/apps/${env.GITHUB_APP_NAME}/installations/new`);
  if (state) url.searchParams.set("state", state);
  return url.toString();
}
