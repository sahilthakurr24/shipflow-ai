import { db, and, eq } from "@repo/database";
import { workflowRunsTable } from "@repo/database/schema";
import {
  createWorkflowRunInput,
  CreateWorkflowRunInputType,
  listWorkflowRunsInput,
  ListWorkflowRunsInputType,
  updateWorkflowRunInput,
  UpdateWorkflowRunInputType,
  workflowRunIdInput,
  WorkflowRunIdInputType,
} from "./model";

class WorkflowService {
  /** Used by Inngest functions to register a long-running workflow. */
  public async createWorkflowRun(payload: CreateWorkflowRunInputType) {
    const values = await createWorkflowRunInput.parseAsync(payload);

    const [result] = await db
      .insert(workflowRunsTable)
      .values(values)
      .returning({ id: workflowRunsTable.id });

    return { id: result?.id };
  }

  public async getWorkflowRunById(payload: WorkflowRunIdInputType) {
    const { id } = await workflowRunIdInput.parseAsync(payload);

    const [result] = await db
      .select()
      .from(workflowRunsTable)
      .where(eq(workflowRunsTable.id, id));

    return { workflowRun: result };
  }

  public async listWorkflowRuns(payload: ListWorkflowRunsInputType) {
    const { organizationId, featureRequestId } = await listWorkflowRunsInput.parseAsync(payload);

    const conditions = [eq(workflowRunsTable.organizationId, organizationId)];
    if (featureRequestId) conditions.push(eq(workflowRunsTable.featureRequestId, featureRequestId));

    const workflowRuns = await db
      .select()
      .from(workflowRunsTable)
      .where(and(...conditions));

    return { workflowRuns };
  }

  /** Used by Inngest functions to report progress/results. */
  public async updateWorkflowRun(payload: UpdateWorkflowRunInputType) {
    const { id, ...fields } = await updateWorkflowRunInput.parseAsync(payload);

    const [result] = await db
      .update(workflowRunsTable)
      .set(fields)
      .where(eq(workflowRunsTable.id, id))
      .returning({ id: workflowRunsTable.id });

    return { id: result?.id };
  }
}

export default WorkflowService;
