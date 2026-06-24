import type { GetStepTools, Inngest } from "inngest";
import { workflowService } from "../services";
import type { CreateWorkflowRunInputType } from "@repo/services/workflow/model";

type Step = GetStepTools<Inngest.Any>;

/**
 * Wraps a workflow's body with the workflow_runs lifecycle: creates the row
 * up front, marks it completed on success, or failed (with the error
 * message) if the body throws. The id passed to `fn` is the workflow_runs
 * row id, for callers that want to report progress mid-run.
 */
export async function runTrackedWorkflow<T>(
  step: Step,
  params: Omit<CreateWorkflowRunInputType, "status">,
  fn: (workflowRunId: string) => Promise<T>,
): Promise<T> {
  const { id } = await step.run("create-workflow-run", () =>
    workflowService.createWorkflowRun({ ...params, status: "running" }),
  );

  if (!id) throw new Error("Failed to create workflow run row");

  try {
    const result = await fn(id);

    await step.run("complete-workflow-run", () =>
      workflowService.updateWorkflowRun({ id, status: "completed", progress: 100 }),
    );

    return result;
  } catch (error) {
    await step.run("fail-workflow-run", () =>
      workflowService.updateWorkflowRun({
        id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    throw error;
  }
}
