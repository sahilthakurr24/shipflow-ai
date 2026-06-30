import { db, and, eq, sql } from "@repo/database";
import { pullRequestFilesTable, pullRequestsTable } from "@repo/database/schema";
import {
  addPullRequestFileInput,
  AddPullRequestFileInputType,
  createPullRequestInput,
  CreatePullRequestInputType,
  listPullRequestFilesInput,
  ListPullRequestFilesInputType,
  listPullRequestsInput,
  ListPullRequestsInputType,
  pullRequestIdInput,
  PullRequestIdInputType,
  snapshotPullRequestInput,
  SnapshotPullRequestInputType,
  updatePullRequestInput,
  UpdatePullRequestInputType,
} from "./model";

class PullRequestService {
  public async createPullRequest(payload: CreatePullRequestInputType) {
    const values = await createPullRequestInput.parseAsync(payload);

    const [result] = await db
      .insert(pullRequestsTable)
      .values(values)
      .returning({ id: pullRequestsTable.id });

    return { id: result?.id };
  }

  public async getPullRequestById(payload: PullRequestIdInputType) {
    const { id } = await pullRequestIdInput.parseAsync(payload);

    const [result] = await db.select().from(pullRequestsTable).where(eq(pullRequestsTable.id, id));

    return { pullRequest: result };
  }

  public async listPullRequests(payload: ListPullRequestsInputType) {
    const { organizationId, repositoryId } = await listPullRequestsInput.parseAsync(payload);

    const conditions = [eq(pullRequestsTable.organizationId, organizationId)];
    if (repositoryId) conditions.push(eq(pullRequestsTable.repositoryId, repositoryId));

    const pullRequests = await db
      .select()
      .from(pullRequestsTable)
      .where(and(...conditions));

    return { pullRequests };
  }

  public async updatePullRequest(payload: UpdatePullRequestInputType) {
    const { id, ...fields } = await updatePullRequestInput.parseAsync(payload);

    const [result] = await db
      .update(pullRequestsTable)
      .set(fields)
      .where(eq(pullRequestsTable.id, id))
      .returning({ id: pullRequestsTable.id });

    return { id: result?.id };
  }

  public async deletePullRequest(payload: PullRequestIdInputType) {
    const { id } = await pullRequestIdInput.parseAsync(payload);

    await db.delete(pullRequestsTable).where(eq(pullRequestsTable.id, id));
  }

  public async addPullRequestFile(payload: AddPullRequestFileInputType) {
    const values = await addPullRequestFileInput.parseAsync(payload);

    const [result] = await db
      .insert(pullRequestFilesTable)
      .values(values)
      .returning({ id: pullRequestFilesTable.id });

    return { id: result?.id };
  }

  public async listPullRequestFiles(payload: ListPullRequestFilesInputType) {
    const { pullRequestId } = await listPullRequestFilesInput.parseAsync(payload);

    const files = await db
      .select()
      .from(pullRequestFilesTable)
      .where(eq(pullRequestFilesTable.pullRequestId, pullRequestId));

    return { files };
  }

  /**
   * Hydrate a pull request from GitHub: upsert the PR row (on
   * repo + PR number) and replace its file snapshot, atomically. The whole
   * thing runs in one transaction so the PR and its files always stay
   * consistent — the AI reviewer never sees a half-updated diff.
   */
  public async snapshotPullRequest(input: SnapshotPullRequestInputType) {
    const { files, ...pullRequest } = await snapshotPullRequestInput.parseAsync(input);

    return db.transaction(async (tx) => {
      const [row] = await tx
        .insert(pullRequestsTable)
        .values(pullRequest)
        .onConflictDoUpdate({
          target: [pullRequestsTable.repositoryId, pullRequestsTable.githubPrNumber],
          set: {
            title: sql`excluded.title`,
            body: sql`excluded.body`,
            state: sql`excluded.state`,
            isDraft: sql`excluded.is_draft`,
            authorLogin: sql`excluded.author_login`,
            headBranch: sql`excluded.head_branch`,
            baseBranch: sql`excluded.base_branch`,
            headSha: sql`excluded.head_sha`,
            headCommitMessage: sql`excluded.head_commit_message`,
            htmlUrl: sql`excluded.html_url`,
            additions: sql`excluded.additions`,
            deletions: sql`excluded.deletions`,
            changedFilesCount: sql`excluded.changed_files_count`,
          },
        })
        .returning({ id: pullRequestsTable.id });

      const pullRequestId = row!.id;

      // Replace the file snapshot so removed files don't linger from a prior push.
      await tx
        .delete(pullRequestFilesTable)
        .where(eq(pullRequestFilesTable.pullRequestId, pullRequestId));

      if (files.length > 0) {
        await tx
          .insert(pullRequestFilesTable)
          .values(files.map((file) => ({ ...file, pullRequestId })));
      }

      return { id: pullRequestId };
    });
  }
}

export default PullRequestService;
