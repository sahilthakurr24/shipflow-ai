import z from "zod";

export {
  createRepositoryInput,
  repositoryIdInput,
  listRepositoriesInput,
  updateRepositoryInput,
} from "@repo/services/repository/model";

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
