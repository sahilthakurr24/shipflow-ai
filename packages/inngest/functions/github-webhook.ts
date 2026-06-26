import { inngest } from "../client";
import { webhookService } from "../services";

type GithubWebhookEventData = {
  eventName?: string;
  deliveryId?: string;
  payload: Record<string, unknown>;
};

export const githubWebhookFunction = inngest.createFunction(
  { id: "github-webhook", triggers: [{ event: "github/webhook.received" }] },
  async ({ event, step }) => {
    const { eventName, deliveryId, payload } = event.data as GithubWebhookEventData;

    const repository = payload.repository as
      | { id?: number | string; name?: string; owner?: { login?: string } }
      | undefined;
    const installation = payload.installation as { id?: number | string } | undefined;
    const pullRequest = payload.pull_request as { number?: number } | undefined;

    const githubRepoId = repository?.id !== undefined ? String(repository.id) : undefined;
    const action = typeof payload.action === "string" ? payload.action : undefined;

    // Persist the raw delivery atomically + idempotently (dedupe on X-GitHub-Delivery).
    const result = await step.run("record-webhook-event", () =>
      webhookService.recordGithubDelivery({
        deliveryId,
        eventType: eventName ?? "unknown",
        action,
        githubRepoId,
        payload,
      }),
    );

    // A redelivered event (same delivery id) was already recorded — nothing to do.
    if (result.duplicate) {
      return { duplicate: true, deliveryId };
    }

    // Fan out pull_request events (for connected repos) to the dedicated function
    // that snapshots the PR and triggers the AI review.
    const REVIEWABLE_ACTIONS = ["opened", "synchronize", "reopened"];
    if (
      eventName === "pull_request" &&
      action !== undefined &&
      REVIEWABLE_ACTIONS.includes(action) &&
      result.repositoryId &&
      result.organizationId &&
      installation?.id !== undefined &&
      pullRequest?.number !== undefined &&
      repository?.owner?.login &&
      repository?.name
    ) {
      await step.sendEvent("emit-pull-request", {
        name: "github/pull_request",
        data: {
          installationId: String(installation.id),
          organizationId: result.organizationId,
          repositoryId: result.repositoryId,
          owner: repository.owner.login,
          repo: repository.name,
          pullNumber: pullRequest.number,
          action,
        },
      });
    }

    return {
      id: result.id,
      repositoryId: result.repositoryId,
      organizationId: result.organizationId,
    };
  },
);
