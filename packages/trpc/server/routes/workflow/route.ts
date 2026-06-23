import { workflowService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  getWorkflowRunOutput,
  listWorkflowRunsInput,
  listWorkflowRunsOutput,
  workflowRunIdInput,
} from "./model";

const TAGS = ["Workflow Runs"];
const getPath = generatePath("/workflow-runs");

export const workflowRouter = router({
  listWorkflowRuns: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listWorkflowRunsInput)
    .output(listWorkflowRunsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return workflowService.listWorkflowRuns(input);
    }),

  getWorkflowRunById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(workflowRunIdInput)
    .output(getWorkflowRunOutput)
    .query(async ({ ctx, input }) => {
      const { workflowRun } = await workflowService.getWorkflowRunById(input);

      if (workflowRun) {
        await assertOrgAccess(ctx.userId, workflowRun.organizationId);
      }

      return { workflowRun };
    }),
});
