import { TRPCError } from "@trpc/server";

import { reviewService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  createReviewInput,
  createReviewOutput,
  deleteReviewOutput,
  getReviewOutput,
  listReviewsInput,
  listReviewsOutput,
  reviewIdInput,
  updateReviewInput,
  updateReviewOutput,
} from "./model";

const TAGS = ["Reviews"];
const getPath = generatePath("/reviews");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const reviewRouter = router({
  createReview: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createReviewInput)
    .output(createReviewOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);
      const { id } = await reviewService.createReview(input);

      if (!id) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create review." });
      }

      return { id };
    }),

  listReviews: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listReviewsInput)
    .output(listReviewsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return reviewService.listReviews(input);
    }),

  getReviewById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(reviewIdInput)
    .output(getReviewOutput)
    .query(async ({ ctx, input }) => {
      const { review } = await reviewService.getReviewById(input);

      if (review) {
        await assertOrgAccess(ctx.userId, review.organizationId);
      }

      return { review };
    }),

  updateReview: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/"), tags: TAGS } })
    .input(updateReviewInput)
    .output(updateReviewOutput)
    .mutation(async ({ ctx, input }) => {
      const { review } = await reviewService.getReviewById({ id: input.id });

      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found." });
      }

      await assertOrgAccess(ctx.userId, review.organizationId);

      return reviewService.updateReview(input);
    }),

  deleteReview: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(reviewIdInput)
    .output(deleteReviewOutput)
    .mutation(async ({ ctx, input }) => {
      const { review } = await reviewService.getReviewById(input);

      if (!review) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Review not found." });
      }

      await assertOrgAccess(ctx.userId, review.organizationId, MANAGE_ROLES);
      await reviewService.deleteReview(input);

      return { success: true };
    }),
});
