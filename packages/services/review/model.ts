import z from "zod";
import {
  issueCategoryEnum,
  issueSeverityEnum,
  issueStatusEnum,
  reviewStatusEnum,
  reviewTriggerEnum,
  reviewVerdictEnum,
} from "@repo/database/schema";

export const reviewTriggerSchema = z.enum(reviewTriggerEnum.enumValues);
export const reviewStatusSchema = z.enum(reviewStatusEnum.enumValues);
export const reviewVerdictSchema = z.enum(reviewVerdictEnum.enumValues);
export const issueSeveritySchema = z.enum(issueSeverityEnum.enumValues);
export const issueCategorySchema = z.enum(issueCategoryEnum.enumValues);
export const issueStatusSchema = z.enum(issueStatusEnum.enumValues);

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
  repositoryId: z.uuid().optional().describe("scope to a repo (via the PR), e.g. a project's repo"),
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

// LLM tools run in strict mode and send explicit `null` to omit a value;
// normalize null → undefined so optional columns are simply left unset.
const nullishToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => v ?? undefined);

export const createReviewIssueInput = z.object({
  reviewId: z.uuid().describe("id of the review"),
  severity: issueSeveritySchema,
  category: issueCategorySchema,
  title: z.string().max(300).describe("short title of the issue"),
  description: z.string().describe("what the issue is"),
  rationale: nullishToUndefined(z.string()),
  suggestion: nullishToUndefined(z.string()),
  filePath: nullishToUndefined(z.string()),
  lineStart: nullishToUndefined(z.number().int()),
  lineEnd: nullishToUndefined(z.number().int()),
  acceptanceCriteriaId: nullishToUndefined(z.uuid()),
  taskId: nullishToUndefined(z.uuid()),
});
// z.input (pre-parse) so callers may pass null; normalized to undefined on parse.
export type CreateReviewIssueInputType = z.input<typeof createReviewIssueInput>;

export const listReviewIssuesInput = z.object({ reviewId: z.uuid().describe("id of the review") });
export type ListReviewIssuesInputType = z.infer<typeof listReviewIssuesInput>;

export const reviewIssueIdInput = z.object({ id: z.uuid().describe("id of the review issue") });
export type ReviewIssueIdInputType = z.infer<typeof reviewIssueIdInput>;

export const updateReviewIssueStatusInput = z.object({
  id: z.uuid().describe("id of the review issue"),
  status: issueStatusSchema,
});
export type UpdateReviewIssueStatusInputType = z.infer<typeof updateReviewIssueStatusInput>;
