import { TRPCError } from "@trpc/server";

import {
  approvalService,
  featureRequestService,
  releaseService,
  reviewService,
} from "../../services";
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
  shipReleaseInput,
  shipReleaseOutput,
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
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create release.",
        });
      }

      return { id };
    }),

  // The ship gate: a feature can only ship with a current `approved` decision and
  // zero unresolved blocking issues. Creates the shipped release and flips the
  // feature's lifecycle status to `shipped`.
  ship: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/ship"), tags: TAGS } })
    .input(shipReleaseInput)
    .output(shipReleaseOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);

      // 1. Require a current `approved` decision (most recent decision wins).
      const { approvals } = await approvalService.listApprovals({
        organizationId: input.organizationId,
        featureRequestId: input.featureRequestId,
      });
      const latestApproval = [...approvals].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
      if (!latestApproval || latestApproval.decision !== "approved") {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Feature is not approved. A human must approve it before it can ship.",
        });
      }

      // 2. Require zero unresolved blocking issues across the feature's reviews.
      const { count } = await reviewService.listOutstandingIssues({
        organizationId: input.organizationId,
        featureRequestId: input.featureRequestId,
      });
      if (count > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Cannot ship: ${count} outstanding blocking ${
            count === 1 ? "issue" : "issues"
          } must be resolved first.`,
        });
      }

      // 3. Create the shipped release (service stamps shippedAt) and advance the feature.
      const { id } = await releaseService.createRelease({
        organizationId: input.organizationId,
        featureRequestId: input.featureRequestId,
        pullRequestId: input.pullRequestId,
        approvalId: latestApproval.id,
        status: "shipped",
        shippedByUserId: ctx.userId,
        version: input.version,
        releaseNotes: input.releaseNotes,
      });
      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create release.",
        });
      }

      await featureRequestService.updateFeatureRequest({
        id: input.featureRequestId,
        status: "shipped",
      });

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
