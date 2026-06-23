import { TRPCError } from "@trpc/server";

import { releaseService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  createReleaseInput,
  createReleaseOutput,
  deleteReleaseOutput,
  getReleaseOutput,
  listReleasesInput,
  listReleasesOutput,
  releaseIdInput,
  updateReleaseInput,
  updateReleaseOutput,
} from "./model";

const TAGS = ["Releases"];
const getPath = generatePath("/releases");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const releaseRouter = router({
  createRelease: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createReleaseInput)
    .output(createReleaseOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);
      const { id } = await releaseService.createRelease(input);

      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create release." });
      }

      return { id };
    }),

  listReleases: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listReleasesInput)
    .output(listReleasesOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return releaseService.listReleases(input);
    }),

  getReleaseById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(releaseIdInput)
    .output(getReleaseOutput)
    .query(async ({ ctx, input }) => {
      const { release } = await releaseService.getReleaseById(input);

      if (release) {
        await assertOrgAccess(ctx.userId, release.organizationId);
      }

      return { release };
    }),

  updateRelease: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/"), tags: TAGS } })
    .input(updateReleaseInput)
    .output(updateReleaseOutput)
    .mutation(async ({ ctx, input }) => {
      const { release } = await releaseService.getReleaseById({ id: input.id });

      if (!release) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Release not found." });
      }

      await assertOrgAccess(ctx.userId, release.organizationId, MANAGE_ROLES);

      return releaseService.updateRelease(input);
    }),

  deleteRelease: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(releaseIdInput)
    .output(deleteReleaseOutput)
    .mutation(async ({ ctx, input }) => {
      const { release } = await releaseService.getReleaseById(input);

      if (!release) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Release not found." });
      }

      await assertOrgAccess(ctx.userId, release.organizationId, MANAGE_ROLES);
      await releaseService.deleteRelease(input);

      return { success: true };
    }),
});
