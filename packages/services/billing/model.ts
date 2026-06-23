import z from "zod";
import {
  paymentStatusEnum,
  planTierEnum,
  subscriptionStatusEnum,
  usageMetricEnum,
} from "@repo/database/schema";

export const planTierSchema = z.enum(planTierEnum.enumValues);
export const subscriptionStatusSchema = z.enum(subscriptionStatusEnum.enumValues);
export const paymentStatusSchema = z.enum(paymentStatusEnum.enumValues);
export const usageMetricSchema = z.enum(usageMetricEnum.enumValues);

export const billingOrganizationInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});

export type BillingOrganizationInputType = z.infer<typeof billingOrganizationInput>;
