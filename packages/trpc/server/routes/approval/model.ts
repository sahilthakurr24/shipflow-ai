import z from "zod";
import { approvalDecisionSchema } from "@repo/services/approval/model";

export {
  createApprovalInput,
  approvalIdInput,
  listApprovalsInput,
} from "@repo/services/approval/model";

export const approvalSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  featureRequestId: z.string(),
  reviewId: z.string().nullable(),
  reviewerUserId: z.string().nullable(),
  decision: approvalDecisionSchema,
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createApprovalOutput = z.object({ id: z.string() });
export const getApprovalOutput = z.object({ approval: approvalSchema.optional() });
export const listApprovalsOutput = z.object({ approvals: z.array(approvalSchema) });
export const deleteApprovalOutput = z.object({ success: z.boolean() });
