import { inngest } from "../client";

export const githubWebhookFunction = inngest.createFunction(
  { id: "github-webhook", triggers: [{ event: "github/webhook.received" }] },
  async ({ step, event }) => {
    //todo
  },
);
