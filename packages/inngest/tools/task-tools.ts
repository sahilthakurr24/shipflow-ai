import { createTool, type Tool } from "@inngest/agent-kit";
import { z } from "zod";
import { taskPrioritySchema, taskTypeSchema } from "@repo/services/task/model";
import { taskService } from "../services";
import { runStep } from "../utils/run-step";

export function createCreateTaskTool(params: {
  organizationId: string;
  featureRequestId: string;
  prdId?: string;
}): Tool.Any {
  return createTool({
    name: "create_task",
    description: "Create one engineering task for this PRD. Call once per task.",
    parameters: z.object({
      title: z
        .string()
        .min(1)
        .max(200)
        .describe(
          "A specific, actionable unit of work, e.g. 'Add rate-limit middleware to /api/login'",
        ),
      description: z
        .string()
        .optional()
        .describe(
          "Enough context that an engineer with no other context could start immediately — what to build, which acceptance criteria it satisfies, and any constraints from the PRD",
        ),
      type: taskTypeSchema
        .optional()
        .describe(
          "feature | bug | chore | test | docs | spike — pick spike only for genuinely exploratory work",
        ),
      priority: taskPrioritySchema
        .optional()
        .describe("Derived from how foundational the task is to the PRD's goals"),
      estimatePoints: z
        .number()
        .int()
        .optional()
        .describe("Relative size (1, 2, 3, 5, or 8) based on complexity"),
      boardPosition: z
        .number()
        .int()
        .optional()
        .describe(
          "Sequential build order reflecting dependencies before dependents, starting at 0",
        ),
    }),
    handler: async (input, { step }) => {
      const { id } = await runStep(step, "create-task", { ...params, ...input }, () =>
        taskService.createTask({
          organizationId: params.organizationId,
          featureRequestId: params.featureRequestId,
          prdId: params.prdId,
          createdByAgent: true,
          ...input,
        }),
      );

      return { success: true, id };
    },
  });
}
