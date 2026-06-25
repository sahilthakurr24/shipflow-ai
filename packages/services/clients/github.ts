import { App } from "octokit";
import { env } from "../env";

let githubApp: App | null = null;

export function getGithubApp(): App {
  if (!githubApp) {
    githubApp = new App({
      appId: env.GITHUB_APP_ID,
      privateKey: env.GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n"),
      webhooks: {
        secret: env.GITHUB_WEBHOOK_SECRET,
      },
    });
  }
  return githubApp;
}

export function getGithubInstallUrl(state?: string) {
  const url = new URL(`https://github.com/apps/${env.GITHUB_APP_NAME}/installations/new`);
  if (state) url.searchParams.set("state", state);
  return url.toString();
}
