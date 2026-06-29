import { createTool, type Tool } from "@inngest/agent-kit";
import { z } from "zod";
import { taskPrioritySchema, taskTypeSchema } from "@repo/services/task/model";
import { taskService } from "../services";
import { runStep } from "../utils/run-step";

/**
 * A single tool that creates ALL tasks for a PRD in one call.
 *
 * This is deliberately not a per-task tool: agent-kit's multi-iteration loop
 * drops tool-result messages from the history it sends to the next inference,
 * which makes OpenAI reject the follow-up call ("tool_call_ids did not have
 * response messages"). Emitting every task in one call lets the planner run at
 * maxIter: 1, so there is never a second inference to corrupt. Array order is
 * the board order (boardPosition). Every field is required-but-nullable for
 * OpenAI strict mode.
 */
export function createCreateTasksTool(params: {
  organizationId: string;
  featureRequestId: string;
  prdId?: string;
}): Tool.Any {
  return createTool({
    name: "create_tasks",
    description:
      "Create the full ordered set of engineering tasks for this PRD in one call. Call exactly once.",
    parameters: z.object({
      tasks: z
        .array(
          z.object({
            title: z
              .string()
              .min(1)
              .max(200)
              .describe(
                "A specific, actionable unit of work, e.g. 'Add rate-limit middleware to /api/login'",
              ),
            description: z
              .string()
              .nullable()
              .describe(
                "Enough context that an engineer with no other access could start immediately — what to build, which acceptance criteria it satisfies, and any constraints; null if none",
              ),
            type: taskTypeSchema
              .nullable()
              .describe(
                "feature | bug | chore | test | docs | spike — spike only for genuinely exploratory work; null defaults to feature",
              ),
            priority: taskPrioritySchema
              .nullable()
              .describe("How foundational the task is to the PRD's goals; null defaults to medium"),
            estimatePoints: z
              .number()
              .int()
              .nullable()
              .describe("Relative size (1, 2, 3, 5, or 8) based on complexity; null if unknown"),
          }),
        )
        .describe(
          "The tasks in build order (dependencies before dependents). Array index becomes the board position.",
        ),
    }),
    handler: async ({ tasks }, { network, step }) => {
      const ids: string[] = [];
      for (const [i, task] of tasks.entries()) {
        const { id } = await runStep(step, "create-task", { ...params, i, ...task }, () =>
          taskService.createTask({
            organizationId: params.organizationId,
            featureRequestId: params.featureRequestId,
            prdId: params.prdId,
            createdByAgent: true,
            boardPosition: i,
            ...task,
          }),
        );
        if (id) ids.push(id);
      }

      network.state.data.taskCount = ids.length;

      return { success: true, count: ids.length };
    },
  });
}
