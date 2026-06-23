import z from "zod";

export {
  createProjectInput,
  projectIdInput,
  listProjectsInput,
  updateProjectInput,
} from "@repo/services/project/model";

export const projectSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  key: z.string(),
  description: z.string().nullable(),
  isArchived: z.boolean(),
  createdByUserId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProjectOutput = z.object({ id: z.string() });
export const getProjectOutput = z.object({ project: projectSchema.optional() });
export const listProjectsOutput = z.object({ projects: z.array(projectSchema) });
export const updateProjectOutput = z.object({ id: z.string().optional() });
export const deleteProjectOutput = z.object({ success: z.boolean() });
