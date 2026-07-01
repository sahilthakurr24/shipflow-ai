import { TRPCError } from "@trpc/server";
import { inngest } from "@repo/inngest";

import { billingService, githubService, pullRequestService, repositoryService } from "../../services";
import { authenticatedProcedure, router } from "../../trpc";
import { assertOrgAccess } from "../../utils/authz";
import { generatePath } from "../../utils/path-generator";
import {
  addPullRequestFileInput,
  addPullRequestFileOutput,
  createPullRequestInput,
  createPullRequestOutput,
  deletePullRequestOutput,
  getPullRequestOutput,
  listPullRequestFilesInput,
  listPullRequestFilesOutput,
  listPullRequestsInput,
  listPullRequestsOutput,
  pullRequestIdInput,
  requestReviewOutput,
  syncFromGithubInput,
  syncFromGithubOutput,
  updatePullRequestInput,
  updatePullRequestOutput,
} from "./model";

const FILE_TAGS = ["Pull Request Files"];

const TAGS = ["Pull Requests"];
const getPath = generatePath("/pull-requests");

const MANAGE_ROLES = ["owner", "admin"] as const;

export const pullRequestRouter = router({
  createPullRequest: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/"), tags: TAGS } })
    .input(createPullRequestInput)
    .output(createPullRequestOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);
      const { id } = await pullRequestService.createPullRequest(input);

      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create pull request.",
        });
      }

      return { id };
    }),

  listPullRequests: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/list"), tags: TAGS } })
    .input(listPullRequestsInput)
    .output(listPullRequestsOutput)
    .query(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      return pullRequestService.listPullRequests(input);
    }),

  getPullRequestById: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/by-id"), tags: TAGS } })
    .input(pullRequestIdInput)
    .output(getPullRequestOutput)
    .query(async ({ ctx, input }) => {
      const { pullRequest } = await pullRequestService.getPullRequestById(input);

      if (pullRequest) {
        await assertOrgAccess(ctx.userId, pullRequest.organizationId);
      }

      return { pullRequest };
    }),

  updatePullRequest: authenticatedProcedure
    .meta({ openapi: { method: "PATCH", path: getPath("/"), tags: TAGS } })
    .input(updatePullRequestInput)
    .output(updatePullRequestOutput)
    .mutation(async ({ ctx, input }) => {
      const { pullRequest } = await pullRequestService.getPullRequestById({ id: input.id });

      if (!pullRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pull request not found." });
      }

      await assertOrgAccess(ctx.userId, pullRequest.organizationId);

      return pullRequestService.updatePullRequest(input);
    }),

  deletePullRequest: authenticatedProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/"), tags: TAGS } })
    .input(pullRequestIdInput)
    .output(deletePullRequestOutput)
    .mutation(async ({ ctx, input }) => {
      const { pullRequest } = await pullRequestService.getPullRequestById(input);

      if (!pullRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pull request not found." });
      }

      await assertOrgAccess(ctx.userId, pullRequest.organizationId, MANAGE_ROLES);
      await pullRequestService.deletePullRequest(input);

      return { success: true };
    }),

  requestReview: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/request-review"), tags: TAGS } })
    .input(pullRequestIdInput)
    .output(requestReviewOutput)
    .mutation(async ({ ctx, input }) => {
      const { pullRequest } = await pullRequestService.getPullRequestById(input);

      if (!pullRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pull request not found." });
      }

      await assertOrgAccess(ctx.userId, pullRequest.organizationId);

      try {
        await billingService.assertAiReviewCredits({ organizationId: pullRequest.organizationId });
      } catch (error) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: error instanceof Error ? error.message : "AI review credit limit reached.",
        });
      }

      await inngest.send({
        name: "pull-request/review.requested",
        data: { pullRequestId: pullRequest.id, organizationId: pullRequest.organizationId },
      });

      return { success: true };
    }),

  // Imports the org's open PRs from GitHub into the section (backfill + a fix for
  // missed webhook deliveries). Idempotent: snapshotPullRequest upserts per
  // (repositoryId, githubPrNumber). The webhook still handles new events live.
  syncFromGithub: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/sync"), tags: TAGS } })
    .input(syncFromGithubInput)
    .output(syncFromGithubOutput)
    .mutation(async ({ ctx, input }) => {
      await assertOrgAccess(ctx.userId, input.organizationId);

      const { repositories } = await repositoryService.listRepositories({
        organizationId: input.organizationId,
      });

      let imported = 0;
      for (const repository of repositories) {
        if (!repository.githubInstallationId) continue;
        const repoRef = {
          installationId: repository.githubInstallationId,
          owner: repository.owner,
          repo: repository.name,
        };

        // One bad/stale installation shouldn't abort the whole sync.
        try {
          const { pullRequests } = await githubService.listOpenPullRequests(repoRef);

          for (const pr of pullRequests) {
            const ref = { ...repoRef, pullNumber: pr.number };
            const { pullRequest } = await githubService.getPullRequest(ref);
            const { files } = await githubService.listPullRequestFiles(ref);

            await pullRequestService.snapshotPullRequest({
              organizationId: input.organizationId,
              repositoryId: repository.id,
              ...pullRequest,
              files,
            });
            imported += 1;
          }
        } catch {
          // Skip this repo; continue with the rest.
        }
      }

      return { imported };
    }),

  addPullRequestFile: authenticatedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/files"), tags: FILE_TAGS } })
    .input(addPullRequestFileInput)
    .output(addPullRequestFileOutput)
    .mutation(async ({ ctx, input }) => {
      const { pullRequest } = await pullRequestService.getPullRequestById({
        id: input.pullRequestId,
      });
      if (!pullRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pull request not found." });
      }

      await assertOrgAccess(ctx.userId, pullRequest.organizationId);
      const { id } = await pullRequestService.addPullRequestFile(input);

      if (!id) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add pull request file.",
        });
      }

      return { id };
    }),

  listPullRequestFiles: authenticatedProcedure
    .meta({ openapi: { method: "GET", path: getPath("/files"), tags: FILE_TAGS } })
    .input(listPullRequestFilesInput)
    .output(listPullRequestFilesOutput)
    .query(async ({ ctx, input }) => {
      const { pullRequest } = await pullRequestService.getPullRequestById({
        id: input.pullRequestId,
      });
      if (!pullRequest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pull request not found." });
      }

      await assertOrgAccess(ctx.userId, pullRequest.organizationId);

      return pullRequestService.listPullRequestFiles(input);
    }),
});
