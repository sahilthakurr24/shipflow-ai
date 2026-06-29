import z from "zod";
import { taskPrioritySchema, taskStatusSchema, taskTypeSchema } from "@repo/services/task/model";

export {
  createTaskInput,
  taskIdInput,
  listTasksInput,
  updateTaskInput,
  moveTaskInput,
  generateTasksInput,
} from "@repo/services/task/model";

export const taskSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  featureRequestId: z.string(),
  prdId: z.string().nullable(),
  projectId: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  type: taskTypeSchema,
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  boardPosition: z.number(),
  estimatePoints: z.number().nullable(),
  assignedToUserId: z.string().nullable(),
  createdByAgent: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createTaskOutput = z.object({ id: z.string() });
export const getTaskOutput = z.object({ task: taskSchema.optional() });
export const listTasksOutput = z.object({ tasks: z.array(taskSchema) });
export const updateTaskOutput = z.object({ id: z.string().optional() });
export const deleteTaskOutput = z.object({ success: z.boolean() });
export const moveTaskOutput = z.object({ id: z.string().optional() });
export const generateTasksOutput = z.object({ success: z.boolean() });
