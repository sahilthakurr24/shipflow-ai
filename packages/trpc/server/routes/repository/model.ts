import z from "zod";

export {
  createRepositoryInput,
  repositoryIdInput,
  listRepositoriesInput,
  updateRepositoryInput,
} from "@repo/services/repository/model";

export { getInstallUrlInput } from "@repo/services/github/model";

// NOTE: `webhookSecret` is intentionally omitted so it is stripped from API output.
export const repositorySchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  projectId: z.string().nullable(),
  provider: z.string(),
  githubRepoId: z.string(),
  githubInstallationId: z.string().nullable(),
  owner: z.string(),
  name: z.string(),
  fullName: z.string(),
  defaultBranch: z.string(),
  isPrivate: z.boolean(),
  htmlUrl: z.string().nullable(),
  connectedByUserId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createRepositoryOutput = z.object({ id: z.string() });
export const getRepositoryOutput = z.object({ repository: repositorySchema.optional() });
export const listRepositoriesOutput = z.object({ repositories: z.array(repositorySchema) });
export const updateRepositoryOutput = z.object({ id: z.string().optional() });
export const deleteRepositoryOutput = z.object({ success: z.boolean() });

export const getInstallUrlOutput = z.object({ url: z.string() });

export const completeGithubInstallationInput = z.object({
  installationId: z.string().describe("GitHub App installation id"),
  organizationId: z.string().describe("id of the organization"),
});
export const completeGithubInstallationOutput = z.object({ count: z.number() });

// --- repo detail (live GitHub data, keyed by our repository id) ---

export const repositoryDetailInput = z.object({
  repositoryId: z.uuid().describe("id of the connected repository"),
});

export const branchSchema = z.object({
  name: z.string(),
  isProtected: z.boolean(),
  commitSha: z.string(),
});
export const getRepoBranchesOutput = z.object({ branches: z.array(branchSchema) });

export const commitSchema = z.object({
  sha: z.string(),
  message: z.string(),
  authorName: z.string(),
  authorLogin: z.string().optional(),
  authorAvatar: z.string().optional(),
  date: z.string().optional(),
  htmlUrl: z.string(),
});
export const getRepoCommitsOutput = z.object({ commits: z.array(commitSchema) });

export const openPullRequestSchema = z.object({
  number: z.number(),
  title: z.string(),
  authorLogin: z.string().optional(),
  headBranch: z.string(),
  baseBranch: z.string(),
  htmlUrl: z.string(),
  createdAt: z.string(),
  isDraft: z.boolean(),
});
export const getRepoOpenPullRequestsOutput = z.object({
  pullRequests: z.array(openPullRequestSchema),
});
