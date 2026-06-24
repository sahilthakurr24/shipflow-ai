import { TRPCError } from "@trpc/server";
import { inngest } from "@repo/inngest";

import { featureRequestService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  addClarificationMessageInput,
  addClarificationMessageOutput,
  createFeatureRequestInput,
  createFeatureRequestOutput,
  deleteFeatureRequestOutput,
  featureRequestIdInput,
  getFeatureRequestOutput,
  listClarificationMessagesInput,
  listClarificationMessagesOutput,
  listFeatureRequestsInput,
  listFeatureRequestsOutput,
  updateFeatureRequestInput,
  updateFeatureRequestOutput,
} from "./model";

const CLARIFICATION_TAGS = ["Feature Request Clarifications"];

const TAGS = ["Feature Requests"];
const getPath = generatePath("/feature-requests");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const featureRequestRouter = router({
  createFeatureRequest: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createFeatureRequestInput)
    .output(createFeatureRequestOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);
      const { id } = await featureRequestService.createFeatureRequest(input);

      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create feature request.",
        });
      }

      await inngest.send({
        name: "feature-request/created",
        data: { featureRequestId: id, organizationId: input.organizationId },
      });

      return { id };
    }),

  listFeatureRequests: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listFeatureRequestsInput)
    .output(listFeatureRequestsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return featureRequestService.listFeatureRequests(input);
    }),

  getFeatureRequestById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(featureRequestIdInput)
    .output(getFeatureRequestOutput)
    .query(async ({ ctx, input }) => {
      const { featureRequest } = await featureRequestService.getFeatureRequestById(input);

      if (featureRequest) {
        await assertOrgAccess(ctx.userId, featureRequest.organizationId);
      }

      return { featureRequest };
    }),

  updateFeatureRequest: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/"), tags: TAGS } })
    .input(updateFeatureRequestInput)
    .output(updateFeatureRequestOutput)
    .mutation(async ({ ctx, input }) => {
      const { featureRequest } = await featureRequestService.getFeatureRequestById({ id: input.id });

      if (!featureRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Feature request not found." });
      }

      await assertOrgAccess(ctx.userId, featureRequest.organizationId);

      return featureRequestService.updateFeatureRequest(input);
    }),

  deleteFeatureRequest: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(featureRequestIdInput)
    .output(deleteFeatureRequestOutput)
    .mutation(async ({ ctx, input }) => {
      const { featureRequest } = await featureRequestService.getFeatureRequestById(input);

      if (!featureRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Feature request not found." });
      }

      await assertOrgAccess(ctx.userId, featureRequest.organizationId, MANAGE_ROLES);
      await featureRequestService.deleteFeatureRequest(input);

      return { success: true };
    }),

  addClarificationMessage: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/clarifications"), tags: CLARIFICATION_TAGS } })
    .input(addClarificationMessageInput)
    .output(addClarificationMessageOutput)
    .mutation(async ({ ctx, input }) => {
      const { featureRequest } = await featureRequestService.getFeatureRequestById({
        id: input.featureRequestId,
      });

      if (!featureRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Feature request not found." });
      }

      await assertOrgAccess(ctx.userId, featureRequest.organizationId);
      const { id } = await featureRequestService.addClarificationMessage(input);

      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add clarification message.",
        });
      }

      if (input.role === "user") {
        await inngest.send({
          name: "feature-request/clarification.replied",
          data: { featureRequestId: input.featureRequestId },
        });
      }

      return { id };
    }),

  listClarificationMessages: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/clarifications"), tags: CLARIFICATION_TAGS } })
    .input(listClarificationMessagesInput)
    .output(listClarificationMessagesOutput)
    .query(async ({ ctx, input }) => {
      const { featureRequest } = await featureRequestService.getFeatureRequestById({
        id: input.featureRequestId,
      });

      if (!featureRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Feature request not found." });
      }

      await assertOrgAccess(ctx.userId, featureRequest.organizationId);

      return featureRequestService.listClarificationMessages(input);
    }),
});
