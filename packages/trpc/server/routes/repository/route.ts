import { TRPCError } from "@trpc/server";

import { repositoryService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  createRepositoryInput,
  createRepositoryOutput,
  deleteRepositoryOutput,
  getRepositoryOutput,
  listRepositoriesInput,
  listRepositoriesOutput,
  repositoryIdInput,
  updateRepositoryInput,
  updateRepositoryOutput,
} from "./model";

const TAGS = ["Repositories"];
const getPath = generatePath("/repositories");

const MANAGE_ROLES = ["owner", "admin"] as const;

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
});
