import z from "zod";

export const listInstallationRepositoriesInput = z.object({
  installationId: z.string().describe("GitHub App installation id"),
});

export type ListInstallationRepositoriesInputType = z.infer<
  typeof listInstallationRepositoriesInput
>;

export const getInstallUrlInput = z.object({
  organizationId: z.uuid().describe("org the install will be linked to"),
});

export type GetInstallUrlInputType = z.infer<typeof getInstallUrlInput>;

export const pullRequestRefInput = z.object({
  installationId: z.string().describe("GitHub App installation id"),
  owner: z.string().describe("repo owner/org login"),
  repo: z.string().describe("repo name"),
  pullNumber: z.number().int().describe("PR number on GitHub"),
});

export type PullRequestRefInputType = z.infer<typeof pullRequestRefInput>;

export const repoRefInput = z.object({
  installationId: z.string().describe("GitHub App installation id"),
  owner: z.string().describe("repo owner/org login"),
  repo: z.string().describe("repo name"),
});

export type RepoRefInputType = z.infer<typeof repoRefInput>;

export const repoContextInput = z.object({
  installationId: z.string().describe("GitHub App installation id"),
  owner: z.string().describe("repo owner/org login"),
  repo: z.string().describe("repo name"),
  defaultBranch: z.string().describe("default branch to read the tree from"),
});

export type RepoContextInputType = z.infer<typeof repoContextInput>;
