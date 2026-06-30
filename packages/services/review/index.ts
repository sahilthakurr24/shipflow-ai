import { db, and, eq, getTableColumns } from "@repo/database";
import { pullRequestsTable, reviewIssuesTable, reviewsTable } from "@repo/database/schema";
import {
  createReviewInput,
  CreateReviewInputType,
  createReviewIssueInput,
  CreateReviewIssueInputType,
  listOutstandingIssuesInput,
  ListOutstandingIssuesInputType,
  listReviewIssuesInput,
  ListReviewIssuesInputType,
  listReviewsInput,
  ListReviewsInputType,
  reviewIdInput,
  ReviewIdInputType,
  reviewIssueIdInput,
  ReviewIssueIdInputType,
  updateReviewInput,
  UpdateReviewInputType,
  updateReviewIssueStatusInput,
  UpdateReviewIssueStatusInputType,
} from "./model";

class ReviewService {
  public async createReview(payload: CreateReviewInputType) {
    const values = await createReviewInput.parseAsync(payload);

    const [result] = await db
      .insert(reviewsTable)
      .values(values)
      .returning({ id: reviewsTable.id });

    return { id: result?.id };
  }

  public async getReviewById(payload: ReviewIdInputType) {
    const { id } = await reviewIdInput.parseAsync(payload);

    const [result] = await db.select().from(reviewsTable).where(eq(reviewsTable.id, id));

    return { review: result };
  }

  public async listReviews(payload: ListReviewsInputType) {
    const { organizationId, pullRequestId, featureRequestId, repositoryId } =
      await listReviewsInput.parseAsync(payload);

    const conditions = [eq(reviewsTable.organizationId, organizationId)];
    if (pullRequestId) conditions.push(eq(reviewsTable.pullRequestId, pullRequestId));
    if (featureRequestId) conditions.push(eq(reviewsTable.featureRequestId, featureRequestId));

    // Scope to a repo via the PR (e.g. a project's connected repo).
    if (repositoryId) {
      const reviews = await db
        .select(getTableColumns(reviewsTable))
        .from(reviewsTable)
        .innerJoin(pullRequestsTable, eq(reviewsTable.pullRequestId, pullRequestsTable.id))
        .where(and(...conditions, eq(pullRequestsTable.repositoryId, repositoryId)));

      return { reviews };
    }

    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(and(...conditions));

    return { reviews };
  }

  public async updateReview(payload: UpdateReviewInputType) {
    const { id, ...fields } = await updateReviewInput.parseAsync(payload);

    const [result] = await db
      .update(reviewsTable)
      .set(fields)
      .where(eq(reviewsTable.id, id))
      .returning({ id: reviewsTable.id });

    return { id: result?.id };
  }

  public async deleteReview(payload: ReviewIdInputType) {
    const { id } = await reviewIdInput.parseAsync(payload);

    await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
  }

  public async createReviewIssue(payload: CreateReviewIssueInputType) {
    const values = await createReviewIssueInput.parseAsync(payload);

    const [result] = await db
      .insert(reviewIssuesTable)
      .values(values)
      .returning({ id: reviewIssuesTable.id });

    return { id: result?.id };
  }

  public async listReviewIssues(payload: ListReviewIssuesInputType) {
    const { reviewId } = await listReviewIssuesInput.parseAsync(payload);

    const issues = await db
      .select()
      .from(reviewIssuesTable)
      .where(eq(reviewIssuesTable.reviewId, reviewId));

    return { issues };
  }

  /**
   * Unresolved blocking issues across ALL of a feature's reviews — the ship gate
   * signal. Joins issues to their review to scope by feature, then keeps only
   * blocking issues still open. (The denormalized blockingCount can't be used: it
   * counts issues regardless of their resolution status.)
   */
  public async listOutstandingIssues(payload: ListOutstandingIssuesInputType) {
    const { organizationId, featureRequestId } =
      await listOutstandingIssuesInput.parseAsync(payload);

    const issues = await db
      .select(getTableColumns(reviewIssuesTable))
      .from(reviewIssuesTable)
      .innerJoin(reviewsTable, eq(reviewIssuesTable.reviewId, reviewsTable.id))
      .where(
        and(
          eq(reviewsTable.organizationId, organizationId),
          eq(reviewsTable.featureRequestId, featureRequestId),
          eq(reviewIssuesTable.severity, "blocking"),
          eq(reviewIssuesTable.status, "open"),
        ),
      );

    return { issues, count: issues.length };
  }

  public async getReviewIssueById(payload: ReviewIssueIdInputType) {
    const { id } = await reviewIssueIdInput.parseAsync(payload);

    const [result] = await db.select().from(reviewIssuesTable).where(eq(reviewIssuesTable.id, id));

    return { issue: result };
  }

  public async updateReviewIssueStatus(payload: UpdateReviewIssueStatusInputType) {
    const { id, status } = await updateReviewIssueStatusInput.parseAsync(payload);

    const [result] = await db
      .update(reviewIssuesTable)
      .set({ status })
      .where(eq(reviewIssuesTable.id, id))
      .returning({ id: reviewIssuesTable.id });

    return { id: result?.id };
  }
}

export default ReviewService;
