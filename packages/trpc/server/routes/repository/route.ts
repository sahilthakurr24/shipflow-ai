import { TRPCError } from "@trpc/server";

import { billingService, githubService, repositoryService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  completeGithubInstallationInput,
  completeGithubInstallationOutput,
  createRepositoryInput,
  createRepositoryOutput,
  deleteRepositoryOutput,
  getInstallUrlInput,
  getInstallUrlOutput,
  getRepoBranchesOutput,
  getRepoCommitsOutput,
  getRepoOpenPullRequestsOutput,
  getRepositoryOutput,
  listRepositoriesInput,
  listRepositoriesOutput,
  repositoryDetailInput,
  repositoryIdInput,
  updateRepositoryInput,
  updateRepositoryOutput,
} from "./model";

const TAGS = ["Repositories"];
const getPath = generatePath("/repositories");

const MANAGE_ROLES = ["owner", "admin"] as const;

/**
 * Resolve a connected repository to the { installationId, owner, repo } ref used
 * for live GitHub reads, after checking the caller can access its organization.
 */
async function resolveRepoRef(userId: string, repositoryId: string) {
  const { repository } = await repositoryService.getRepositoryById({ id: repositoryId });

  if (!repository) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found." });
  }

  await assertOrgAccess(userId, repository.organizationId);

  if (!repository.githubInstallationId) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Repository is not linked to a GitHub installation.",
    });
  }

  return {
    installationId: repository.githubInstallationId,
    owner: repository.owner,
    repo: repository.name,
  };
}

export const repositoryRouter = router({
  createRepository: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createRepositoryInput)
    .output(createRepositoryOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);
      const { id } = await repositoryService.createRepository(input);

      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to connect repository.",
        });
      }

      return { id };
    }),

  listRepositories: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listRepositoriesInput)
    .output(listRepositoriesOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return repositoryService.listRepositories(input);
    }),

  getGithubInstallUrl: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/install-url"), tags: TAGS } })
    .input(getInstallUrlInput)
    .output(getInstallUrlOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);

      return githubService.getInstallUrl(input);
    }),

  completeGithubInstallation: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/install/complete"), tags: TAGS } })
    .input(completeGithubInstallationInput)
    .output(completeGithubInstallationOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);

      const { repositories } = await githubService.listInstallationRepositories({
        installationId: input.installationId,
      });

      const { newCount } = await repositoryService.countNewRepositories({
        organizationId: input.organizationId,
        githubRepoIds: repositories.map((r) => r.githubRepoId),
      });

      try {
        await billingService.assertRepositoryCapacity({
          organizationId: input.organizationId,
          additionalCount: newCount,
        });
      } catch (error) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: error instanceof Error ? error.message : "Repository limit reached.",
        });
      }

      return repositoryService.upsertFromInstallation({
        organizationId: input.organizationId,
        githubInstallationId: input.installationId,
        connectedByUserId: ctx.userId,
        repositories,
      });
    }),

  getRepositoryById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(repositoryIdInput)
    .output(getRepositoryOutput)
    .query(async ({ ctx, input }) => {
      const { repository } = await repositoryService.getRepositoryById(input);

      if (repository) {
        await assertOrgAccess(ctx.userId, repository.organizationId);
      }

      return { repository };
    }),

  updateRepository: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/"), tags: TAGS } })
    .input(updateRepositoryInput)
    .output(updateRepositoryOutput)
    .mutation(async ({ ctx, input }) => {
      const { repository } = await repositoryService.getRepositoryById({ id: input.id });

      if (!repository) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found." });
      }

      await assertOrgAccess(ctx.userId, repository.organizationId, MANAGE_ROLES);

      return repositoryService.updateRepository(input);
    }),

  deleteRepository: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(repositoryIdInput)
    .output(deleteRepositoryOutput)
    .mutation(async ({ ctx, input }) => {
      const { repository } = await repositoryService.getRepositoryById(input);

      if (!repository) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Repository not found." });
      }

      await assertOrgAccess(ctx.userId, repository.organizationId, MANAGE_ROLES);
      await repositoryService.deleteRepository(input);

      return { success: true };
    }),

  getRepoBranches: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/branches"), tags: TAGS } })
    .input(repositoryDetailInput)
    .output(getRepoBranchesOutput)
    .query(async ({ ctx, input }) => {
      const ref = await resolveRepoRef(ctx.userId, input.repositoryId);
      return githubService.listBranches(ref);
    }),

  getRepoCommits: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/commits"), tags: TAGS } })
    .input(repositoryDetailInput)
    .output(getRepoCommitsOutput)
    .query(async ({ ctx, input }) => {
      const ref = await resolveRepoRef(ctx.userId, input.repositoryId);
      return githubService.listCommits(ref);
    }),

  getRepoOpenPullRequests: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/open-pull-requests"), tags: TAGS } })
    .input(repositoryDetailInput)
    .output(getRepoOpenPullRequestsOutput)
    .query(async ({ ctx, input }) => {
      const ref = await resolveRepoRef(ctx.userId, input.repositoryId);
      return githubService.listOpenPullRequests(ref);
    }),
});
