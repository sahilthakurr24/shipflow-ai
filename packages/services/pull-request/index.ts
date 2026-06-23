import { db, and, eq } from "@repo/database";
import { pullRequestsTable } from "@repo/database/schema";
import {
  createPullRequestInput,
  CreatePullRequestInputType,
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

    const [result] = await db
      .select()
      .from(pullRequestsTable)
      .where(eq(pullRequestsTable.id, id));

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
}

export default PullRequestService;
