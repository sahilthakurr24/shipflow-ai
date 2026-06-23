import { db, and, eq } from "@repo/database";
import { reviewsTable } from "@repo/database/schema";
import {
  createReviewInput,
  CreateReviewInputType,
  listReviewsInput,
  ListReviewsInputType,
  reviewIdInput,
  ReviewIdInputType,
  updateReviewInput,
  UpdateReviewInputType,
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
    const { organizationId, pullRequestId } = await listReviewsInput.parseAsync(payload);

    const conditions = [eq(reviewsTable.organizationId, organizationId)];
    if (pullRequestId) conditions.push(eq(reviewsTable.pullRequestId, pullRequestId));

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
}

export default ReviewService;
