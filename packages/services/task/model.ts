import z from "zod";
import { priorityEnum, taskStatusEnum, taskTypeEnum } from "@repo/database/schema";

export const taskStatusSchema = z.enum(taskStatusEnum.enumValues);
export const taskTypeSchema = z.enum(taskTypeEnum.enumValues);
export const taskPrioritySchema = z.enum(priorityEnum.enumValues);

// LLM tools run in strict mode and send explicit `null` to omit a value;
// normalize null → undefined so NOT NULL columns fall back to their defaults.
const nullishToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  schema.nullish().transform((v) => v ?? undefined);

export const createTaskInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().describe("id of the feature request"),
  prdId: z.uuid().optional(),
  projectId: z.uuid().optional(),
  title: z.string().min(1).max(200).describe("title of the task"),
  description: nullishToUndefined(z.string()),
  type: nullishToUndefined(taskTypeSchema),
  status: nullishToUndefined(taskStatusSchema),
  priority: nullishToUndefined(taskPrioritySchema),
  boardPosition: nullishToUndefined(z.number().int()),
  estimatePoints: nullishToUndefined(z.number().int()),
  assignedToUserId: z.uuid().optional(),
  createdByAgent: z.boolean().optional(),
});

// z.input (pre-parse) so callers may pass null for the strict-mode-nullable
// fields; the schema normalizes them to undefined on parse.
export type CreateTaskInputType = z.input<typeof createTaskInput>;

export const taskIdInput = z.object({ id: z.uuid().describe("id of the task") });
export type TaskIdInputType = z.infer<typeof taskIdInput>;

export const listTasksInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  featureRequestId: z.uuid().optional(),
  projectId: z.uuid().optional().describe("scope to a project"),
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

// Move/reorder a task on the Kanban board. `orderedIds` is the destination
// column's full ordered list of task ids *after* the move (it includes taskId);
// the service writes boardPosition = index for each in a single transaction.
export const moveTaskInput = z.object({
  taskId: z.uuid().describe("id of the moved task"),
  status: taskStatusSchema.describe("destination column status"),
  orderedIds: z.array(z.uuid()).describe("destination column task ids in their new order"),
});
export type MoveTaskInputType = z.infer<typeof moveTaskInput>;

export const generateTasksInput = z.object({
  prdId: z.uuid().describe("id of the approved PRD to generate tasks from"),
});
export type GenerateTasksInputType = z.infer<typeof generateTasksInput>;
