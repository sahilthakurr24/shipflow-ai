import z from "zod";
import { workflowStatusSchema, workflowTypeSchema } from "@repo/services/workflow/model";

export { workflowRunIdInput, listWorkflowRunsInput } from "@repo/services/workflow/model";

const jsonObject = z.record(z.string(), z.unknown());

export const workflowRunSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  featureRequestId: z.string().nullable(),
  type: workflowTypeSchema,
  status: workflowStatusSchema,
  inngestEventId: z.string().nullable(),
  inngestRunId: z.string().nullable(),
  currentStep: z.string().nullable(),
  progress: z.number(),
  totalSteps: z.number().nullable(),
  input: jsonObject.nullable(),
  output: jsonObject.nullable(),
  error: z.string().nullable(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getWorkflowRunOutput = z.object({ workflowRun: workflowRunSchema.optional() });
export const listWorkflowRunsOutput = z.object({ workflowRuns: z.array(workflowRunSchema) });
