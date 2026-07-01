import { and, db, eq, inArray, sql } from "@repo/database";
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
  upsertFromInstallationInput,
  UpsertFromInstallationInputType,
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

  /**
   * Of `githubRepoIds`, how many aren't already connected for this org — i.e.
   * how many would actually be *new* if upserted. Re-syncing already-connected
   * repos doesn't count against a repository-limit check, only genuine growth
   * does.
   */
  public async countNewRepositories(payload: { organizationId: string; githubRepoIds: string[] }) {
    const { organizationId, githubRepoIds } = payload;

    if (githubRepoIds.length === 0) return { newCount: 0 };

    const existing = await db
      .select({ githubRepoId: repositoriesTable.githubRepoId })
      .from(repositoriesTable)
      .where(
        and(
          eq(repositoriesTable.organizationId, organizationId),
          inArray(repositoriesTable.githubRepoId, githubRepoIds),
        ),
      );
    const existingIds = new Set(existing.map((r) => r.githubRepoId));

    return { newCount: githubRepoIds.filter((id) => !existingIds.has(id)).length };
  }

  /** Upsert the repositories granted to a GitHub App installation. */
  public async upsertFromInstallation(payload: UpsertFromInstallationInputType) {
    const { organizationId, githubInstallationId, connectedByUserId, repositories } =
      await upsertFromInstallationInput.parseAsync(payload);

    if (repositories.length === 0) return { count: 0 };

    const rows = repositories.map((repo) => ({
      ...repo,
      organizationId,
      githubInstallationId,
      connectedByUserId,
    }));

    await db
      .insert(repositoriesTable)
      .values(rows)
      .onConflictDoUpdate({
        target: [repositoriesTable.organizationId, repositoriesTable.githubRepoId],
        set: {
          githubInstallationId: sql`excluded.github_installation_id`,
          owner: sql`excluded.owner`,
          name: sql`excluded.name`,
          fullName: sql`excluded.full_name`,
          defaultBranch: sql`excluded.default_branch`,
          isPrivate: sql`excluded.is_private`,
          htmlUrl: sql`excluded.html_url`,
        },
      });

    return { count: rows.length };
  }
}

export default RepositoryService;
