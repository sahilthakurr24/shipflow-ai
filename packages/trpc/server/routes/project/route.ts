import { TRPCError } from "@trpc/server";

import { projectService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  createProjectInput,
  createProjectOutput,
  deleteProjectOutput,
  getProjectOutput,
  listProjectsInput,
  listProjectsOutput,
  projectIdInput,
  updateProjectInput,
  updateProjectOutput,
} from "./model";

const TAGS = ["Projects"];
const getPath = generatePath("/projects");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const projectRouter = router({
  createProject: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createProjectInput)
    .output(createProjectOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);
      const { id } = await projectService.createProject(input);

      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create project." });
      }

      return { id };
    }),

  listProjects: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listProjectsInput)
    .output(listProjectsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return projectService.listProjects(input);
    }),

  getProjectById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(projectIdInput)
    .output(getProjectOutput)
    .query(async ({ ctx, input }) => {
      const { project } = await projectService.getProjectById(input);

      if (project) {
        await assertOrgAccess(ctx.userId, project.organizationId);
      }

      return { project };
    }),

  updateProject: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/"), tags: TAGS } })
    .input(updateProjectInput)
    .output(updateProjectOutput)
    .mutation(async ({ ctx, input }) => {
      const { project } = await projectService.getProjectById({ id: input.id });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }

      await assertOrgAccess(ctx.userId, project.organizationId);

      return projectService.updateProject(input);
    }),

  deleteProject: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(projectIdInput)
    .output(deleteProjectOutput)
    .mutation(async ({ ctx, input }) => {
      const { project } = await projectService.getProjectById(input);

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found." });
      }

      await assertOrgAccess(ctx.userId, project.organizationId, MANAGE_ROLES);
      await projectService.deleteProject(input);

      return { success: true };
    }),
});
