import z from "zod";
import { pullRequestStateSchema } from "@repo/services/pull-request/model";

export {
  createPullRequestInput,
  pullRequestIdInput,
  listPullRequestsInput,
  updatePullRequestInput,
} from "@repo/services/pull-request/model";

export const pullRequestSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  repositoryId: z.string(),
  featureRequestId: z.string().nullable(),
  githubPrNumber: z.number(),
  githubPrId: z.string().nullable(),
  title: z.string(),
  body: z.string().nullable(),
  state: pullRequestStateSchema,
  isDraft: z.boolean(),
  authorLogin: z.string().nullable(),
  headBranch: z.string().nullable(),
  baseBranch: z.string().nullable(),
  headSha: z.string().nullable(),
  htmlUrl: z.string().nullable(),
  additions: z.number(),
  deletions: z.number(),
  changedFilesCount: z.number(),
  mergedAt: z.date().nullable(),
  closedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createPullRequestOutput = z.object({ id: z.string() });
export const getPullRequestOutput = z.object({ pullRequest: pullRequestSchema.optional() });
export const listPullRequestsOutput = z.object({ pullRequests: z.array(pullRequestSchema) });
export const updatePullRequestOutput = z.object({ id: z.string().optional() });
export const deletePullRequestOutput = z.object({ success: z.boolean() });
