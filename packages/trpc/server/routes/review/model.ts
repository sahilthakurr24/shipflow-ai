import z from "zod";
import {
  issueCategorySchema,
  issueSeveritySchema,
  issueStatusSchema,
  reviewStatusSchema,
  reviewTriggerSchema,
  reviewVerdictSchema,
} from "@repo/services/review/model";

export {
  createReviewInput,
  reviewIdInput,
  listReviewsInput,
  listOutstandingIssuesInput,
  updateReviewInput,
  createReviewIssueInput,
  listReviewIssuesInput,
  updateReviewIssueStatusInput,
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

export const reviewIssueSchema = z.object({
  id: z.string(),
  reviewId: z.string(),
  severity: issueSeveritySchema,
  category: issueCategorySchema,
  title: z.string(),
  description: z.string(),
  rationale: z.string().nullable(),
  suggestion: z.string().nullable(),
  filePath: z.string().nullable(),
  lineStart: z.number().nullable(),
  lineEnd: z.number().nullable(),
  acceptanceCriteriaId: z.string().nullable(),
  taskId: z.string().nullable(),
  status: issueStatusSchema,
  githubCommentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createReviewIssueOutput = z.object({ id: z.string() });
export const listReviewIssuesOutput = z.object({ issues: z.array(reviewIssueSchema) });
export const listOutstandingIssuesOutput = z.object({
  issues: z.array(reviewIssueSchema),
  count: z.number(),
});
export const updateReviewIssueStatusOutput = z.object({ id: z.string().optional() });
