import { zodUndefinedModel } from "../../schema";
import { billingService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  billingOrganizationInput,
  cancelSubscriptionInput,
  cancelSubscriptionOutput,
  createCheckoutSubscriptionInput,
  createCheckoutSubscriptionOutput,
  getSubscriptionOutput,
  listPaymentsOutput,
  listPlansOutput,
  listUsageRecordsOutput,
} from "./model";

const TAGS = ["Billing"];
const getPath = generatePath("/billing");

export const billingRouter = router({
  getSubscription: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/subscription"), tags: TAGS } })
    .input(billingOrganizationInput)
    .output(getSubscriptionOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return billingService.getSubscription(input);
    }),

  listPayments: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/payments"), tags: TAGS } })
    .input(billingOrganizationInput)
    .output(listPaymentsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return billingService.listPayments(input);
    }),

  listUsageRecords: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/usage"), tags: TAGS } })
    .input(billingOrganizationInput)
    .output(listUsageRecordsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return billingService.listUsageRecords(input);
    }),

  listPlans: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/plans"), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(listPlansOutput)
    .query(async () => {
      return billingService.listPlans();
    }),

  createCheckoutSubscription: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/checkout-subscription"), tags: TAGS } })
    .input(createCheckoutSubscriptionInput)
    .output(createCheckoutSubscriptionOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, ["owner", "admin"]);

      return billingService.createCheckoutSubscription(input);
    }),

  cancelSubscription: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/cancel-subscription"), tags: TAGS } })
    .input(cancelSubscriptionInput)
    .output(cancelSubscriptionOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, ["owner", "admin"]);

      return billingService.cancelSubscription(input);
    }),
});
