import { billingService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  billingOrganizationInput,
  getSubscriptionOutput,
  listPaymentsOutput,
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
});
