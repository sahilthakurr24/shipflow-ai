import z from "zod";
import {
  billingPeriodEnum,
  paymentStatusEnum,
  planTierEnum,
  subscriptionStatusEnum,
  usageMetricEnum,
} from "@repo/database/schema";

export const planTierSchema = z.enum(planTierEnum.enumValues);
export const subscriptionStatusSchema = z.enum(subscriptionStatusEnum.enumValues);
export const paymentStatusSchema = z.enum(paymentStatusEnum.enumValues);
export const usageMetricSchema = z.enum(usageMetricEnum.enumValues);
export const billingPeriodSchema = z.enum(billingPeriodEnum.enumValues);

export const billingOrganizationInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});

export type BillingOrganizationInputType = z.infer<typeof billingOrganizationInput>;

// --- write-side schemas: user-initiated actions (checkout, cancel) ---

export const createCheckoutSubscriptionInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});
export type CreateCheckoutSubscriptionInputType = z.infer<typeof createCheckoutSubscriptionInput>;

export const cancelSubscriptionInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  cancelAtPeriodEnd: z
    .boolean()
    .default(true)
    .describe(
      "true = let the current paid period finish before downgrading; false = cancel immediately",
    ),
});
export type CancelSubscriptionInputType = z.infer<typeof cancelSubscriptionInput>;

// --- internal schemas: only ever populated from a verified Razorpay webhook payload ---

export const activateSubscriptionInput = z.object({
  razorpaySubscriptionId: z.string(),
  currentPeriodStart: z.date().optional(),
  currentPeriodEnd: z.date().optional(),
});
export type ActivateSubscriptionInputType = z.infer<typeof activateSubscriptionInput>;

export const recordSubscriptionChargedInput = activateSubscriptionInput;
export type RecordSubscriptionChargedInputType = ActivateSubscriptionInputType;

export const markPastDueInput = z.object({ razorpaySubscriptionId: z.string() });
export type MarkPastDueInputType = z.infer<typeof markPastDueInput>;

export const finalizeCancellationInput = z.object({ razorpaySubscriptionId: z.string() });
export type FinalizeCancellationInputType = z.infer<typeof finalizeCancellationInput>;

export const recordPaymentInput = z.object({
  razorpaySubscriptionId: z
    .string()
    .optional()
    .describe("used to resolve the organization/subscription this payment belongs to"),
  razorpayPaymentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  amount: z.number().describe("amount in paise"),
  currency: z.string().default("INR"),
  status: paymentStatusSchema,
  method: z.string().optional(),
  description: z.string().optional(),
});
export type RecordPaymentInputType = z.infer<typeof recordPaymentInput>;

// --- plan config: our own DB-owned source of truth for pricing/limits ---

export const planConfigSchema = z.object({
  id: z.string(),
  tier: planTierSchema,
  name: z.string(),
  description: z.string().nullable(),
  amount: z.number().nullable(),
  currency: z.string(),
  period: billingPeriodSchema,
  intervalCount: z.number(),
  seats: z.number(),
  repositoryLimit: z.number(),
  aiReviewCreditsTotal: z.number(),
  razorpayPlanId: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PlanConfigType = z.infer<typeof planConfigSchema>;

// --- AI review credit metering ---

export const recordAiReviewUsageInput = z.object({
  organizationId: z.uuid(),
  reviewId: z.uuid(),
  featureRequestId: z.uuid().optional(),
});
export type RecordAiReviewUsageInputType = z.infer<typeof recordAiReviewUsageInput>;
