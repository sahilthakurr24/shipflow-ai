import { TRPCError } from "@trpc/server";
import { inngest } from "@repo/inngest";

import { prdService, taskService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  createTaskInput,
  createTaskOutput,
  deleteTaskOutput,
  generateTasksInput,
  generateTasksOutput,
  getTaskOutput,
  listTasksInput,
  listTasksOutput,
  moveTaskInput,
  moveTaskOutput,
  taskIdInput,
  updateTaskInput,
  updateTaskOutput,
} from "./model";

const TAGS = ["Tasks"];
const getPath = generatePath("/tasks");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const taskRouter = router({
  createTask: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createTaskInput)
    .output(createTaskOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);
      const { id } = await taskService.createTask(input);

      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create task." });
      }

      return { id };
    }),

  listTasks: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listTasksInput)
    .output(listTasksOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return taskService.listTasks(input);
    }),

  getTaskById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(taskIdInput)
    .output(getTaskOutput)
    .query(async ({ ctx, input }) => {
      const { task } = await taskService.getTaskById(input);

      if (task) {
        await assertOrgAccess(ctx.userId, task.organizationId);
      }

      return { task };
    }),

  updateTask: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/"), tags: TAGS } })
    .input(updateTaskInput)
    .output(updateTaskOutput)
    .mutation(async ({ ctx, input }) => {
      const { task } = await taskService.getTaskById({ id: input.id });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      await assertOrgAccess(ctx.userId, task.organizationId);

      return taskService.updateTask(input);
    }),

  deleteTask: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(taskIdInput)
    .output(deleteTaskOutput)
    .mutation(async ({ ctx, input }) => {
      const { task } = await taskService.getTaskById(input);

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      await assertOrgAccess(ctx.userId, task.organizationId, MANAGE_ROLES);
      await taskService.deleteTask(input);

      return { success: true };
    }),

  moveTask: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/move"), tags: TAGS } })
    .input(moveTaskInput)
    .output(moveTaskOutput)
    .mutation(async ({ ctx, input }) => {
      const { task } = await taskService.getTaskById({ id: input.taskId });

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
      }

      await assertOrgAccess(ctx.userId, task.organizationId);

      // organizationId is server-supplied so the reindex is scoped to this org.
      return taskService.moveTask({ ...input, organizationId: task.organizationId });
    }),

  generateTasks: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/generate"), tags: TAGS } })
    .input(generateTasksInput)
    .output(generateTasksOutput)
    .mutation(async ({ ctx, input }) => {
      const { prd } = await prdService.getPrdById({ id: input.prdId });

      if (!prd) {
        throw new TRPCError({ code: "NOT_FOUND", message: "PRD not found." });
      }

      await assertOrgAccess(ctx.userId, prd.organizationId, MANAGE_ROLES);

      await inngest.send({
        name: "prd/tasks.requested",
        data: {
          prdId: prd.id,
          organizationId: prd.organizationId,
          featureRequestId: prd.featureRequestId,
        },
      });

      return { success: true };
    }),
});
