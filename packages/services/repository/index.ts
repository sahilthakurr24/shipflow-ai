import { db, eq } from "@repo/database";
import { repositoriesTable } from "@repo/database/schema";
import {
  createRepositoryInput,
  CreateRepositoryInputType,
  listRepositoriesInput,
  ListRepositoriesInputType,
  repositoryIdInput,
  RepositoryIdInputType,
  updateRepositoryInput,
  UpdateRepositoryInputType,
} from "./model";

class RepositoryService {
  public async createRepository(payload: CreateRepositoryInputType) {
    const values = await createRepositoryInput.parseAsync(payload);

    const [result] = await db
      .insert(repositoriesTable)
      .values(values)
      .returning({ id: repositoriesTable.id });

    return { id: result?.id };
  }

  public async getRepositoryById(payload: RepositoryIdInputType) {
    const { id } = await repositoryIdInput.parseAsync(payload);

    const [result] = await db.select().from(repositoriesTable).where(eq(repositoriesTable.id, id));

    return { repository: result };
  }

  public async listRepositories(payload: ListRepositoriesInputType) {
    const { organizationId } = await listRepositoriesInput.parseAsync(payload);

    const repositories = await db
      .select()
      .from(repositoriesTable)
      .where(eq(repositoriesTable.organizationId, organizationId));

    return { repositories };
  }

  public async updateRepository(payload: UpdateRepositoryInputType) {
    const { id, ...fields } = await updateRepositoryInput.parseAsync(payload);

    const [result] = await db
      .update(repositoriesTable)
      .set(fields)
      .where(eq(repositoriesTable.id, id))
      .returning({ id: repositoriesTable.id });

    return { id: result?.id };
  }

  public async deleteRepository(payload: RepositoryIdInputType) {
    const { id } = await repositoryIdInput.parseAsync(payload);

    await db.delete(repositoriesTable).where(eq(repositoriesTable.id, id));
  }
}

export default RepositoryService;
