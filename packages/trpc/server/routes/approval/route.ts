import { TRPCError } from "@trpc/server";

import { approvalService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  approvalIdInput,
  createApprovalInput,
  createApprovalOutput,
  deleteApprovalOutput,
  getApprovalOutput,
  listApprovalsInput,
  listApprovalsOutput,
} from "./model";

const TAGS = ["Approvals"];
const getPath = generatePath("/approvals");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const approvalRouter = router({
  createApproval: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createApprovalInput)
    .output(createApprovalOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId, MANAGE_ROLES);
      const { id } = await approvalService.createApproval({
        ...input,
        reviewerUserId: input.reviewerUserId ?? ctx.userId,
      });

      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to record approval.",
        });
      }

      return { id };
    }),

  listApprovals: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listApprovalsInput)
    .output(listApprovalsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return approvalService.listApprovals(input);
    }),

  getApprovalById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(approvalIdInput)
    .output(getApprovalOutput)
    .query(async ({ ctx, input }) => {
      const { approval } = await approvalService.getApprovalById(input);

      if (approval) {
        await assertOrgAccess(ctx.userId, approval.organizationId);
      }

      return { approval };
    }),

  deleteApproval: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(approvalIdInput)
    .output(deleteApprovalOutput)
    .mutation(async ({ ctx, input }) => {
      const { approval } = await approvalService.getApprovalById(input);

      if (!approval) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Approval not found." });
      }

      await assertOrgAccess(ctx.userId, approval.organizationId, MANAGE_ROLES);
      await approvalService.deleteApproval(input);

      return { success: true };
    }),
});
