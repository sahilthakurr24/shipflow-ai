import { db, eq } from "@repo/database";
import { projectsTable } from "@repo/database/schema";
import {
  createProjectInput,
  CreateProjectInputType,
  listProjectsInput,
  ListProjectsInputType,
  projectIdInput,
  ProjectIdInputType,
  updateProjectInput,
  UpdateProjectInputType,
} from "./model";

class ProjectService {
  public async createProject(payload: CreateProjectInputType) {
    const values = await createProjectInput.parseAsync(payload);

    const [result] = await db
      .insert(projectsTable)
      .values(values)
      .returning({ id: projectsTable.id });

    return { id: result?.id };
  }

  public async getProjectById(payload: ProjectIdInputType) {
    const { id } = await projectIdInput.parseAsync(payload);

    const [result] = await db.select().from(projectsTable).where(eq(projectsTable.id, id));

    return { project: result };
  }

  public async listProjects(payload: ListProjectsInputType) {
    const { organizationId } = await listProjectsInput.parseAsync(payload);

    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.organizationId, organizationId));

    return { projects };
  }

  public async updateProject(payload: UpdateProjectInputType) {
    const { id, ...fields } = await updateProjectInput.parseAsync(payload);

    const [result] = await db
      .update(projectsTable)
      .set(fields)
      .where(eq(projectsTable.id, id))
      .returning({ id: projectsTable.id });

    return { id: result?.id };
  }

  public async deleteProject(payload: ProjectIdInputType) {
    const { id } = await projectIdInput.parseAsync(payload);

    await db.delete(projectsTable).where(eq(projectsTable.id, id));
  }
}

export default ProjectService;
