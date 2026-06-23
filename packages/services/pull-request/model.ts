import z from "zod";
import { pullRequestFileStatusEnum, pullRequestStateEnum } from "@repo/database/schema";

export const pullRequestStateSchema = z.enum(pullRequestStateEnum.enumValues);
export const pullRequestFileStatusSchema = z.enum(pullRequestFileStatusEnum.enumValues);

export const createPullRequestInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  repositoryId: z.uuid().describe("id of the repository"),
  featureRequestId: z.uuid().optional(),
  githubPrNumber: z.number().int().describe("PR number on GitHub"),
  githubPrId: z.string().max(64).optional(),
  title: z.string().max(512).describe("title of the pull request"),
  body: z.string().optional(),
  state: pullRequestStateSchema.optional(),
  isDraft: z.boolean().optional(),
  authorLogin: z.string().max(255).optional(),
  headBranch: z.string().max(255).optional(),
  baseBranch: z.string().max(255).optional(),
  headSha: z.string().max(64).optional(),
  htmlUrl: z.string().optional(),
  additions: z.number().int().optional(),
  deletions: z.number().int().optional(),
  changedFilesCount: z.number().int().optional(),
});

export type CreatePullRequestInputType = z.infer<typeof createPullRequestInput>;

export const pullRequestIdInput = z.object({ id: z.uuid().describe("id of the pull request") });
export type PullRequestIdInputType = z.infer<typeof pullRequestIdInput>;

export const listPullRequestsInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  repositoryId: z.uuid().optional(),
});
export type ListPullRequestsInputType = z.infer<typeof listPullRequestsInput>;

export const updatePullRequestInput = z.object({
  id: z.uuid().describe("id of the pull request"),
  title: z.string().max(512).optional(),
  body: z.string().optional(),
  state: pullRequestStateSchema.optional(),
  isDraft: z.boolean().optional(),
  headSha: z.string().max(64).optional(),
  additions: z.number().int().optional(),
  deletions: z.number().int().optional(),
  changedFilesCount: z.number().int().optional(),
});

export type UpdatePullRequestInputType = z.infer<typeof updatePullRequestInput>;

export const addPullRequestFileInput = z.object({
  pullRequestId: z.uuid().describe("id of the pull request"),
  filename: z.string().describe("path of the changed file"),
  status: pullRequestFileStatusSchema,
  previousFilename: z.string().optional(),
  additions: z.number().int().optional(),
  deletions: z.number().int().optional(),
  changes: z.number().int().optional(),
  patch: z.string().optional(),
});
export type AddPullRequestFileInputType = z.infer<typeof addPullRequestFileInput>;

export const listPullRequestFilesInput = z.object({
  pullRequestId: z.uuid().describe("id of the pull request"),
});
export type ListPullRequestFilesInputType = z.infer<typeof listPullRequestFilesInput>;
