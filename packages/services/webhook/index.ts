import { db, eq } from "@repo/database";
import { repositoriesTable, webhookEventsTable } from "@repo/database/schema";
import {
  createWebhookEventInput,
  CreateWebhookEventInputType,
  listWebhookEventsInput,
  ListWebhookEventsInputType,
  recordGithubDeliveryInput,
  RecordGithubDeliveryInputType,
  webhookEventIdInput,
  WebhookEventIdInputType,
} from "./model";

class WebhookService {
  /** Used by the GitHub webhook handler to persist inbound deliveries. */
  public async createWebhookEvent(payload: CreateWebhookEventInputType) {
    const values = await createWebhookEventInput.parseAsync(payload);

    const [result] = await db
      .insert(webhookEventsTable)
      .values(values)
      .returning({ id: webhookEventsTable.id });

    return { id: result?.id };
  }

  /**
   * Atomically record an inbound GitHub delivery: resolve the connected
   * repository (and its org) from the payload's repo id, then insert the event.
   * The whole read-then-write runs in one transaction so the row reflects a
   * consistent snapshot, and `onConflictDoNothing` on `deliveryId` makes
   * re-deliveries idempotent (returns `duplicate: true` instead of erroring).
   */
  public async recordGithubDelivery(input: RecordGithubDeliveryInputType) {
    const { deliveryId, eventType, action, githubRepoId, payload } =
      await recordGithubDeliveryInput.parseAsync(input);

    return db.transaction(async (tx) => {
      let repositoryId: string | undefined;
      let organizationId: string | undefined;

      if (githubRepoId) {
        const [repo] = await tx
          .select({
            id: repositoriesTable.id,
            organizationId: repositoriesTable.organizationId,
          })
          .from(repositoriesTable)
          .where(eq(repositoriesTable.githubRepoId, githubRepoId));

        repositoryId = repo?.id;
        organizationId = repo?.organizationId;
      }

      const [inserted] = await tx
        .insert(webhookEventsTable)
        .values({
          provider: "github",
          deliveryId,
          eventType,
          action,
          repositoryId,
          organizationId,
          payload,
        })
        .onConflictDoNothing({ target: webhookEventsTable.deliveryId })
        .returning({ id: webhookEventsTable.id });

      return {
        id: inserted?.id,
        repositoryId,
        organizationId,
        duplicate: !inserted,
      };
    });
  }

  public async getWebhookEventById(payload: WebhookEventIdInputType) {
    const { id } = await webhookEventIdInput.parseAsync(payload);

    const [result] = await db
      .select()
      .from(webhookEventsTable)
      .where(eq(webhookEventsTable.id, id));

    return { webhookEvent: result };
  }

  public async listWebhookEvents(payload: ListWebhookEventsInputType) {
    const { organizationId } = await listWebhookEventsInput.parseAsync(payload);

    const webhookEvents = await db
      .select()
      .from(webhookEventsTable)
      .where(eq(webhookEventsTable.organizationId, organizationId));

    return { webhookEvents };
  }
}

export default WebhookService;
