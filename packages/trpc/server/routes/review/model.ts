import z from "zod";
import {
  reviewStatusSchema,
  reviewTriggerSchema,
  reviewVerdictSchema,
} from "@repo/services/review/model";

export {
  createReviewInput,
  reviewIdInput,
  listReviewsInput,
  updateReviewInput,
} from "@repo/services/review/model";

export const reviewSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  pullRequestId: z.string(),
  featureRequestId: z.string().nullable(),
  prdId: z.string().nullable(),
  attempt: z.number(),
  trigger: reviewTriggerSchema,
  status: reviewStatusSchema,
  verdict: reviewVerdictSchema.nullable(),
  summary: z.string().nullable(),
  model: z.string().nullable(),
  readinessScore: z.number().nullable(),
  reviewedSha: z.string().nullable(),
  blockingCount: z.number(),
  nonBlockingCount: z.number(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createReviewOutput = z.object({ id: z.string() });
export const getReviewOutput = z.object({ review: reviewSchema.optional() });
export const listReviewsOutput = z.object({ reviews: z.array(reviewSchema) });
export const updateReviewOutput = z.object({ id: z.string().optional() });
export const deleteReviewOutput = z.object({ success: z.boolean() });
