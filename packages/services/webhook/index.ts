import { db, eq } from "@repo/database";
import { webhookEventsTable } from "@repo/database/schema";
import {
  createWebhookEventInput,
  CreateWebhookEventInputType,
  listWebhookEventsInput,
  ListWebhookEventsInputType,
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
