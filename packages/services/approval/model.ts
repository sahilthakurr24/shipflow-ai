import z from "zod";
import { approvalDecisionEnum } from "@repo/database/schema";

export const approvalDecisionSchema = z.enum(approvalDecisionEnum.enumValues);

export const createApprovalInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().describe("id of the feature request"),
  decision: approvalDecisionSchema,
  reviewId: z.uuid().optional(),
  reviewerUserId: z.uuid().optional(),
  notes: z.string().optional(),
});

export type CreateApprovalInputType = z.infer<typeof createApprovalInput>;

export const approvalIdInput = z.object({ id: z.uuid().describe("id of the approval") });
export type ApprovalIdInputType = z.infer<typeof approvalIdInput>;

export const listApprovalsInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().optional(),
});
export type ListApprovalsInputType = z.infer<typeof listApprovalsInput>;
