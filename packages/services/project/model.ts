import z from "zod";

export const createProjectInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
  name: z.string().min(1).max(120).describe("name of the project"),
  key: z.string().min(1).max(16).describe("short key of the project"),
  description: z.string().optional(),
  createdByUserId: z.uuid().optional(),
});

export type CreateProjectInputType = z.infer<typeof createProjectInput>;

export const projectIdInput = z.object({
  id: z.uuid().describe("id of the project"),
});

export type ProjectIdInputType = z.infer<typeof projectIdInput>;

export const listProjectsInput = z.object({
  organizationId: z.uuid().describe("id of the organization"),
});

export type ListProjectsInputType = z.infer<typeof listProjectsInput>;

export const updateProjectInput = z.object({
  id: z.uuid().describe("id of the project"),
  name: z.string().min(1).max(120).optional(),
  description: z.string().optional(),
  isArchived: z.boolean().optional(),
});

export type UpdateProjectInputType = z.infer<typeof updateProjectInput>;
