import z from "zod";
import { workflowStatusEnum, workflowTypeEnum } from "@repo/database/schema";

export const workflowTypeSchema = z.enum(workflowTypeEnum.enumValues);
export const workflowStatusSchema = z.enum(workflowStatusEnum.enumValues);
const jsonObject = z.record(z.string(), z.unknown());

export const createWorkflowRunInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  type: workflowTypeSchema,
  featureRequestId: z.uuid().optional(),
  status: workflowStatusSchema.optional(),
  inngestEventId: z.string().max(120).optional(),
  inngestRunId: z.string().max(120).optional(),
  currentStep: z.string().max(120).optional(),
  totalSteps: z.number().int().optional(),
  input: jsonObject.optional(),
});

export type CreateWorkflowRunInputType = z.infer<typeof createWorkflowRunInput>;

export const workflowRunIdInput = z.object({ id: z.uuid().describe("id of the workflow run") });
export type WorkflowRunIdInputType = z.infer<typeof workflowRunIdInput>;

export const listWorkflowRunsInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().optional(),
});
export type ListWorkflowRunsInputType = z.infer<typeof listWorkflowRunsInput>;

export const updateWorkflowRunInput = z.object({
  id: z.uuid().describe("id of the workflow run"),
  status: workflowStatusSchema.optional(),
  currentStep: z.string().max(120).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  output: jsonObject.optional(),
  error: z.string().optional(),
});

export type UpdateWorkflowRunInputType = z.infer<typeof updateWorkflowRunInput>;
