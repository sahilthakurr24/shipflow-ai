import z from "zod";
import { reviewStatusEnum, reviewTriggerEnum, reviewVerdictEnum } from "@repo/database/schema";

export const reviewTriggerSchema = z.enum(reviewTriggerEnum.enumValues);
export const reviewStatusSchema = z.enum(reviewStatusEnum.enumValues);
export const reviewVerdictSchema = z.enum(reviewVerdictEnum.enumValues);

export const createReviewInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  pullRequestId: z.uuid().describe("id of the pull request"),
  featureRequestId: z.uuid().optional(),
  prdId: z.uuid().optional(),
  trigger: reviewTriggerSchema,
  attempt: z.number().int().positive().optional(),
  status: reviewStatusSchema.optional(),
  model: z.string().max(100).optional(),
  reviewedSha: z.string().max(64).optional(),
});

export type CreateReviewInputType = z.infer<typeof createReviewInput>;

export const reviewIdInput = z.object({ id: z.uuid().describe("id of the review") });
export type ReviewIdInputType = z.infer<typeof reviewIdInput>;

export const listReviewsInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  pullRequestId: z.uuid().optional(),
});
export type ListReviewsInputType = z.infer<typeof listReviewsInput>;

export const updateReviewInput = z.object({
  id: z.uuid().describe("id of the review"),
  status: reviewStatusSchema.optional(),
  verdict: reviewVerdictSchema.optional(),
  summary: z.string().optional(),
  readinessScore: z.number().int().min(0).max(100).optional(),
  blockingCount: z.number().int().optional(),
  nonBlockingCount: z.number().int().optional(),
});

export type UpdateReviewInputType = z.infer<typeof updateReviewInput>;
