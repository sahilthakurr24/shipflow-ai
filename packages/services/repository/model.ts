import z from "zod";

export const createRepositoryInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  projectId: z.uuid().optional(),
  githubRepoId: z.string().max(64).describe("GitHub numeric repo id"),
  githubInstallationId: z.string().max(64).optional(),
  owner: z.string().max(255).describe("repo owner/org login"),
  name: z.string().max(255).describe("repo name"),
  fullName: z.string().max(512).describe("owner/name"),
  defaultBranch: z.string().max(255).optional(),
  isPrivate: z.boolean().optional(),
  htmlUrl: z.string().optional(),
  webhookSecret: z.string().optional(),
  connectedByUserId: z.uuid().optional(),
});

export type CreateRepositoryInputType = z.infer<typeof createRepositoryInput>;

export const repositoryIdInput = z.object({
  id: z.uuid().describe("id of the repository"),
});

export type RepositoryIdInputType = z.infer<typeof repositoryIdInput>;

export const listRepositoriesInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});

export type ListRepositoriesInputType = z.infer<typeof listRepositoriesInput>;

export const updateRepositoryInput = z.object({
  id: z.uuid().describe("id of the repository"),
  projectId: z.uuid().nullable().optional(),
  defaultBranch: z.string().max(255).optional(),
  isPrivate: z.boolean().optional(),
  githubInstallationId: z.string().max(64).optional(),
  webhookSecret: z.string().optional(),
});

export type UpdateRepositoryInputType = z.infer<typeof updateRepositoryInput>;
