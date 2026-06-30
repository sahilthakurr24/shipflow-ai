import z from "zod";
import {
  pullRequestFileStatusSchema,
  pullRequestStateSchema,
} from "@repo/services/pull-request/model";

export {
  createPullRequestInput,
  pullRequestIdInput,
  listPullRequestsInput,
  updatePullRequestInput,
  addPullRequestFileInput,
  listPullRequestFilesInput,
} from "@repo/services/pull-request/model";

// Import the org's open PRs from GitHub into the section.
export const syncFromGithubInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});

export const syncFromGithubOutput = z.object({
  imported: z.number(),
});

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
  headCommitMessage: z.string().nullable(),
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
export const requestReviewOutput = z.object({ success: z.boolean() });
export const deletePullRequestOutput = z.object({ success: z.boolean() });

export const pullRequestFileSchema = z.object({
  id: z.string(),
  pullRequestId: z.string(),
  filename: z.string(),
  previousFilename: z.string().nullable(),
  status: pullRequestFileStatusSchema,
  additions: z.number(),
  deletions: z.number(),
  changes: z.number(),
  patch: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const addPullRequestFileOutput = z.object({ id: z.string() });
export const listPullRequestFilesOutput = z.object({ files: z.array(pullRequestFileSchema) });
