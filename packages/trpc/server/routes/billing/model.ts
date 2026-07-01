import z from "zod";
import {
  billingOrganizationInput,
  billingPeriodSchema,
  cancelSubscriptionInput,
  createCheckoutSubscriptionInput,
  paymentStatusSchema,
  planTierSchema,
  subscriptionStatusSchema,
  usageMetricSchema,
} from "@repo/services/billing/model";

export { billingOrganizationInput, cancelSubscriptionInput, createCheckoutSubscriptionInput };

const jsonObject = z.record(z.string(), z.unknown());

export const subscriptionSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  plan: planTierSchema,
  status: subscriptionStatusSchema,
  razorpayCustomerId: z.string().nullable(),
  razorpaySubscriptionId: z.string().nullable(),
  razorpayPlanId: z.string().nullable(),
  seats: z.number(),
  repositoryLimit: z.number(),
  aiReviewCreditsTotal: z.number(),
  aiReviewCreditsUsed: z.number(),
  currentPeriodStart: z.date().nullable(),
  currentPeriodEnd: z.date().nullable(),
  cancelAtPeriodEnd: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const paymentSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  subscriptionId: z.string().nullable(),
  razorpayPaymentId: z.string().nullable(),
  razorpayOrderId: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  status: paymentStatusSchema,
  method: z.string().nullable(),
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const usageRecordSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  metric: usageMetricSchema,
  quantity: z.number(),
  featureRequestId: z.string().nullable(),
  reviewId: z.string().nullable(),
  metadata: jsonObject.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getSubscriptionOutput = z.object({ subscription: subscriptionSchema.optional() });
export const listPaymentsOutput = z.object({ payments: z.array(paymentSchema) });
export const listUsageRecordsOutput = z.object({ usageRecords: z.array(usageRecordSchema) });

export const createCheckoutSubscriptionOutput = z.object({
  razorpaySubscriptionId: z.string(),
  razorpayKeyId: z.string(),
});
export const cancelSubscriptionOutput = z.object({ subscription: subscriptionSchema.optional() });

export const planSchema = z.object({
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
export const listPlansOutput = z.object({ plans: z.array(planSchema) });
