import z from "zod";
import { webhookProviderEnum } from "@repo/database/schema";

export const webhookProviderSchema = z.enum(webhookProviderEnum.enumValues);
const jsonObject = z.record(z.string(), z.unknown());

export const createWebhookEventInput = z.object({
  provider: webhookProviderSchema.optional(),
  organizationId: z.uuid().optional(),
  repositoryId: z.uuid().optional(),
  deliveryId: z.string().max(120).optional(),
  eventType: z.string().max(80).describe("webhook event type"),
  action: z.string().max(80).optional(),
  payload: jsonObject,
});

export type CreateWebhookEventInputType = z.infer<typeof createWebhookEventInput>;

export const recordGithubDeliveryInput = z.object({
  deliveryId: z.string().max(120).optional().describe("GitHub X-GitHub-Delivery header"),
  eventType: z.string().max(80).describe("GitHub X-GitHub-Event header"),
  action: z.string().max(80).optional().describe("payload.action, if present"),
  githubRepoId: z.string().max(64).optional().describe("payload.repository.id"),
  payload: jsonObject,
});

export type RecordGithubDeliveryInputType = z.infer<typeof recordGithubDeliveryInput>;

export const webhookEventIdInput = z.object({ id: z.uuid().describe("id of the webhook event") });
export type WebhookEventIdInputType = z.infer<typeof webhookEventIdInput>;

export const listWebhookEventsInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});
export type ListWebhookEventsInputType = z.infer<typeof listWebhookEventsInput>;
