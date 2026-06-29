import { createState } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import { createCodeReviewerAgent } from "../agents/code-reviewer";
import { inngest } from "../client";
import { prdService, pullRequestService, reviewService } from "../services";
import { runTrackedWorkflow } from "../utils/workflow-run";

type AiReviewState = {
  verdict?: "approved" | "changes_requested" | "commented" | "needs_human_review";
  summary?: string;
  readinessScore?: number;
};

type PullRequest = {
  title: string;
  body: string | null;
  baseBranch: string | null;
  headBranch: string | null;
  featureRequestId: string | null;
};
type PullRequestFile = {
  filename: string;
  status: string;
  additions: number | null;
  deletions: number | null;
  patch: string | null;
};
type AcceptanceCriterion = { id: string; description: string };

function buildPrompt(
  pullRequest: PullRequest,
  files: PullRequestFile[],
  hasPrd: boolean,
  acceptanceCriteria: AcceptanceCriterion[],
) {
  const filesText = files.length
    ? files
        .map(
          (f) =>
            `### ${f.filename} (${f.status}, +${f.additions ?? 0}/-${f.deletions ?? 0})\n${
              f.patch ?? "(no patch available)"
            }`,
        )
        .join("\n\n")
    : "(no changed files)";

  const criteriaText = hasPrd
    ? acceptanceCriteria.length
      ? acceptanceCriteria.map((c) => `- [${c.id}] ${c.description}`).join("\n")
      : "(PRD has no acceptance criteria recorded)"
    : "(no PRD linked to this pull request)";

  return `Pull request: ${pullRequest.title}
Body: ${pullRequest.body ?? "(none)"}
Base branch: ${pullRequest.baseBranch ?? "unknown"} <- Head branch: ${pullRequest.headBranch ?? "unknown"}

Acceptance criteria:
${criteriaText}

Changed files:
${filesText}`;
}

export const aiReviewFunction = inngest.createFunction(
  { id: "ai-review", triggers: [{ event: "pull-request/review.requested" }] },
  async ({ event, step }) => {
    const { pullRequestId, organizationId } = event.data as {
      pullRequestId: string;
      organizationId: string;
    };

    return runTrackedWorkflow(step, { organizationId, type: "ai_review" }, async () => {
      const { pullRequest } = await step.run("get-pull-request", () =>
        pullRequestService.getPullRequestById({ id: pullRequestId }),
      );
      if (!pullRequest) throw new NonRetriableError("Pull request not found");

      const { files } = await step.run("list-pull-request-files", () =>
        pullRequestService.listPullRequestFiles({ pullRequestId }),
      );

      let prdId: string | undefined;
      let acceptanceCriteria: AcceptanceCriterion[] = [];

      if (pullRequest.featureRequestId) {
        const featureRequestId = pullRequest.featureRequestId;

        const { prds } = await step.run("list-prds-for-feature-request", () =>
          prdService.listPrds({ organizationId, featureRequestId }),
        );
        const prd = prds[0];

        if (prd) {
          prdId = prd.id;

          const result = await step.run("list-acceptance-criteria", () =>
            prdService.listAcceptanceCriteria({ prdId: prd.id }),
          );
          acceptanceCriteria = result.acceptanceCriteria;
        }
      }

      const { id: reviewId } = await step.run("create-review", () =>
        reviewService.createReview({
          organizationId,
          pullRequestId,
          featureRequestId: pullRequest.featureRequestId ?? undefined,
          prdId,
          trigger: "manual",
          status: "running",
        }),
      );
      if (!reviewId) throw new Error("Failed to create review");

      const agent = createCodeReviewerAgent(reviewId);
      const state = createState<AiReviewState>();
      // maxIter: 1 — the reviewer submits the whole review in a single forced
      // submit_review call, so there is no second inference (which agent-kit would
      // send without the tool-result message, causing an OpenAI 400).
      await agent.run(buildPrompt(pullRequest, files, Boolean(prdId), acceptanceCriteria), {
        state,
        step,
        maxIter: 1,
      });

      if (!state.data.verdict) {
        await step.run("fallback-needs-human-review", () =>
          reviewService.updateReview({
            id: reviewId,
            status: "completed",
            verdict: "needs_human_review",
            summary: "The AI reviewer did not reach a verdict within its turn limit.",
          }),
        );
      }

      return { reviewId, verdict: state.data.verdict ?? "needs_human_review" };
    });
  },
);
