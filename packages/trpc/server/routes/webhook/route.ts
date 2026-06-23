import { webhookService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  getWebhookEventOutput,
  listWebhookEventsInput,
  listWebhookEventsOutput,
  webhookEventIdInput,
} from "./model";

const TAGS = ["Webhook Events"];
const getPath = generatePath("/webhook-events");

export const webhookRouter = router({
  listWebhookEvents: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listWebhookEventsInput)
    .output(listWebhookEventsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return webhookService.listWebhookEvents(input);
    }),

  getWebhookEventById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(webhookEventIdInput)
    .output(getWebhookEventOutput)
    .query(async ({ ctx, input }) => {
      const { webhookEvent } = await webhookService.getWebhookEventById(input);

      // Only return events scoped to an org the caller belongs to.
      if (!webhookEvent || !webhookEvent.organizationId) {
        return { webhookEvent: undefined };
      }

      await assertOrgAccess(ctx.userId, webhookEvent.organizationId);

      return { webhookEvent };
    }),
});
