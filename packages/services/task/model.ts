import z from "zod";
import { priorityEnum, taskStatusEnum, taskTypeEnum } from "@repo/database/schema";

export const taskStatusSchema = z.enum(taskStatusEnum.enumValues);
export const taskTypeSchema = z.enum(taskTypeEnum.enumValues);
export const taskPrioritySchema = z.enum(priorityEnum.enumValues);

export const createTaskInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().describe("id of the feature request"),
  prdId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  title: z.string().min(1).max(200).describe("title of the task"),
  description: z.string().optional(),
  type: taskTypeSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  boardPosition: z.number().int().optional(),
  estimatePoints: z.number().int().optional(),
  assignedToUserId: z.uuid().optional(),
  createdByAgent: z.boolean().optional(),
});

export type CreateTaskInputType = z.infer<typeof createTaskInput>;

export const taskIdInput = z.object({ id: z.uuid().describe("id of the task") });
export type TaskIdInputType = z.infer<typeof taskIdInput>;

export const listTasksInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().optional(),
});
export type ListTasksInputType = z.infer<typeof listTasksInput>;

export const updateTaskInput = z.object({
  id: z.uuid().describe("id of the task"),
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  type: taskTypeSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  boardPosition: z.number().int().optional(),
  estimatePoints: z.number().int().optional(),
  assignedToUserId: z.uuid().optional(),
});

export type UpdateTaskInputType = z.infer<typeof updateTaskInput>;
