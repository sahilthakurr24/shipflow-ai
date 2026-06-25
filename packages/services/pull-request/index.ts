import { db, and, eq } from "@repo/database";
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
}

export default PullRequestService;
