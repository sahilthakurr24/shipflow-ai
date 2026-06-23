import z from "zod";
import { webhookProviderSchema } from "@repo/services/webhook/model";

export { webhookEventIdInput, listWebhookEventsInput } from "@repo/services/webhook/model";

const jsonObject = z.record(z.string(), z.unknown());

export const webhookEventSchema = z.object({
  id: z.string(),
  provider: webhookProviderSchema,
  organizationId: z.string().nullable(),
  repositoryId: z.string().nullable(),
  deliveryId: z.string().nullable(),
  eventType: z.string(),
  action: z.string().nullable(),
  payload: jsonObject,
  processed: z.boolean(),
  processedAt: z.date().nullable(),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getWebhookEventOutput = z.object({ webhookEvent: webhookEventSchema.optional() });
export const listWebhookEventsOutput = z.object({ webhookEvents: z.array(webhookEventSchema) });
