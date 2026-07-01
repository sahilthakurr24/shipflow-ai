import { createState } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import { createCodeReviewerAgent } from "../agents/code-reviewer";
import { createPrdMatcherAgent } from "../agents/prd-matcher";
import { inngest } from "../client";
import { CODE_REVIEW_MODEL } from "../models";
import {
  billingService,
  featureRequestService,
  prdService,
  pullRequestService,
  reviewService,
} from "../services";
import { runTrackedWorkflow } from "../utils/workflow-run";

type AiReviewState = {
  verdict?: "approved" | "changes_requested" | "commented" | "needs_human_review";
  summary?: string;
  readinessScore?: number;
};

type PrdMatchState = {
  featureRequestId?: string;
};

type PullRequest = {
  title: string;
  body: string | null;
  baseBranch: string | null;
  headBranch: string | null;
  headSha: string | null;
  repositoryId: string;
  featureRequestId: string | null;
};

type FeatureRequestCandidate = {
  id: string;
  title: string;
  description: string | null;
};
type PullRequestFile = {
  filename: string;
  status: string;
  additions: number | null;
  deletions: number | null;
  patch: string | null;
};
type AcceptanceCriterion = { id: string; description: string };

type UserStories = {
  id: string;
  prdId: string;
  asA: string | null;
  iWant: string | null;
  soThat: string | null;
  narrative: string | null;
  orderIndex: number;
};

type PRD = {
  id: string;
  version: number;
  organizationId: string;
  featureRequestId: string;
  status: "approved" | "draft" | "generating" | "ready" | "archived";
  createdAt: string;
  updatedAt: string;
  title: string;
  problemStatement: string | null;
  goals: string[];
  nonGoals: string[];
  edgeCases: string[];
  assumptions: string[];
  successMetrics: string[];
  generatedByModel: string | null;
  approvedByUserId: string | null;
  approvedAt: string | null;
} | null;

function buildPrompt(
  pullRequest: PullRequest,
  files: PullRequestFile[],
  hasPrd: boolean,
  acceptanceCriteria: AcceptanceCriterion[],
  userStories: UserStories[],
  prd: PRD,
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

  const bullets = (items: string[] | null | undefined) =>
    items && items.length ? items.map((i) => `- ${i}`).join("\n") : "(none)";

  const prdText =
    hasPrd && prd
      ? `Title: ${prd.title}
Problem statement: ${prd.problemStatement ?? "(none)"}
Goals:
${bullets(prd.goals)}
Non-goals (OUT of scope — flag any change that does these):
${bullets(prd.nonGoals)}
Edge cases:
${bullets(prd.edgeCases)}
Assumptions:
${bullets(prd.assumptions)}
Success metrics:
${bullets(prd.successMetrics)}`
      : "(no PRD linked to this pull request)";

  const userStoryText = hasPrd
    ? userStories.length
      ? userStories
          .map((s) =>
            s.asA || s.iWant || s.soThat
              ? `- As a ${s.asA ?? "user"}, I want ${s.iWant ?? "…"}, so that ${s.soThat ?? "…"}.`
              : `- ${s.narrative ?? "(empty)"}`,
          )
          .join("\n")
      : "(PRD has no user stories recorded)"
    : "(no PRD linked to this pull request)";

  const criteriaText = hasPrd
    ? acceptanceCriteria.length
      ? acceptanceCriteria.map((c) => `- [${c.id}] ${c.description}`).join("\n")
      : "(PRD has no acceptance criteria recorded)"
    : "(no PRD linked to this pull request)";

  // Ordered intent → specifics → diff so the model reads top-down.
  return `Pull request: ${pullRequest.title}
Body: ${pullRequest.body ?? "(none)"}
Base branch: ${pullRequest.baseBranch ?? "unknown"} <- Head branch: ${pullRequest.headBranch ?? "unknown"}

PRD (what this change is meant to implement):
${prdText}

User stories:
${userStoryText}

Acceptance criteria:
${criteriaText}

Changed files:
${filesText}`;
}

function buildMatchPrompt(
  pullRequest: PullRequest,
  files: PullRequestFile[],
  candidates: FeatureRequestCandidate[],
) {
  // Only the file paths — enough signal to match intent without paying for the
  // full diff in this cheap classification step.
  const pathsText = files.length
    ? files.map((f) => `- ${f.filename}`).join("\n")
    : "(no changed files)";

  const candidatesText = candidates
    .map(
      (c, i) =>
        `${i + 1}. id: ${c.id}\n   title: ${c.title}\n   description: ${c.description ?? "(none)"}`,
    )
    .join("\n");

  return `Pull request: ${pullRequest.title}
Body: ${pullRequest.body ?? "(none)"}
Head branch: ${pullRequest.headBranch ?? "unknown"}

Changed file paths:
${pathsText}

Candidate feature requests (each has a PRD):
${candidatesText}

Pick the ONE candidate this PR implements, or null if none clearly matches.`;
}

export const aiReviewFunction = inngest.createFunction(
  { id: "ai-review", triggers: [{ event: "pull-request/review.requested" }] },
  async ({ event, step }) => {
    const { pullRequestId, organizationId } = event.data as {
      pullRequestId: string;
      organizationId: string;
    };

    // Blocks before any review row (or workflow-run row) is created, so an org
    // over its quota doesn't accumulate phantom "running" reviews. This is the
    // only check for the webhook-auto-triggered path — the tRPC `requestReview`
    // mutation checks separately, up front, for a faster user-facing rejection.
    try {
      await step.run("check-ai-review-credits", () =>
        billingService.assertAiReviewCredits({ organizationId }),
      );
    } catch (error) {
      throw new NonRetriableError(
        error instanceof Error ? error.message : "AI review credit limit reached.",
      );
    }

    return runTrackedWorkflow(step, { organizationId, type: "ai_review" }, async () => {
      const { pullRequest } = await step.run("get-pull-request", () =>
        pullRequestService.getPullRequestById({ id: pullRequestId }),
      );
      if (!pullRequest) throw new NonRetriableError("Pull request not found");

      const { files } = await step.run("list-pull-request-files", () =>
        pullRequestService.listPullRequestFiles({ pullRequestId }),
      );

      // Resolve which feature request (and thus PRD) grounds this review. A human
      // link on the PR always wins; otherwise auto-match against the repo's
      // feature requests that have a PRD, then persist the pick so it shows in the
      // UI and approval works.
      let featureRequestId = pullRequest.featureRequestId ?? undefined;

      if (!featureRequestId) {
        const { featureRequests } = await step.run("list-feature-requests", () =>
          featureRequestService.listFeatureRequests({ organizationId }),
        );
        const { prds: orgPrds } = await step.run("list-org-prds", () =>
          prdService.listPrds({ organizationId }),
        );
        const prdFeatureRequestIds = new Set(orgPrds.map((p) => p.featureRequestId));

        // Only same-repo feature requests that actually have a PRD are reviewable
        // targets.
        const candidates: FeatureRequestCandidate[] = featureRequests
          .filter(
            (fr) => fr.repositoryId === pullRequest.repositoryId && prdFeatureRequestIds.has(fr.id),
          )
          .map((fr) => ({ id: fr.id, title: fr.title, description: fr.description }));

        if (candidates.length === 1) {
          // No ambiguity — skip the LLM call.
          featureRequestId = candidates[0]!.id;
        } else if (candidates.length > 1) {
          const matchState = createState<PrdMatchState>();
          await createPrdMatcherAgent().run(buildMatchPrompt(pullRequest, files, candidates), {
            state: matchState,
            step,
            maxIter: 1,
          });
          const picked = matchState.data.featureRequestId;
          // Trust only an id the model copied from the candidate list.
          if (picked && candidates.some((c) => c.id === picked)) {
            featureRequestId = picked;
          }
        }

        if (featureRequestId) {
          await step.run("link-feature-request", () =>
            pullRequestService.updatePullRequest({ id: pullRequestId, featureRequestId }),
          );
        }
      }

      let prdId: string | undefined;
      let acceptanceCriteria: AcceptanceCriterion[] = [];
      let userStories: UserStories[] = [];
      let mainPrd: PRD = null;

      if (featureRequestId) {
        const { prds } = await step.run("list-prds-for-feature-request", () =>
          prdService.listPrds({ organizationId, featureRequestId }),
        );
        const prd = prds[0];

        if (prd) {
          prdId = prd.id;
          mainPrd = prd;

          const result = await step.run("list-acceptance-criteria", () =>
            prdService.listAcceptanceCriteria({ prdId: prd.id }),
          );
          acceptanceCriteria = result.acceptanceCriteria;

          const result2 = await step.run("list-user-stories", () =>
            prdService.listUserStories({ prdId: prd.id }),
          );

          userStories = result2.userStories;
        }
      }

      // Number this run so re-reviews are distinguishable in the UI.
      const { reviews: existingReviews } = await step.run("count-existing-reviews", () =>
        reviewService.listReviews({ organizationId, pullRequestId }),
      );

      const { id: reviewId } = await step.run("create-review", () =>
        reviewService.createReview({
          organizationId,
          pullRequestId,
          featureRequestId,
          prdId,
          trigger: "manual",
          status: "running",
          attempt: existingReviews.length + 1,
          model: CODE_REVIEW_MODEL,
          // Pin the review to the exact commit it evaluated so the UI can detect
          // when newer commits have landed since (stale review).
          reviewedSha: pullRequest.headSha ?? undefined,
        }),
      );
      if (!reviewId) throw new Error("Failed to create review");

      const agent = createCodeReviewerAgent(reviewId);
      const state = createState<AiReviewState>();
      // maxIter: 1 — the reviewer submits the whole review in a single forced
      // submit_review call, so there is no second inference (which agent-kit would
      // send without the tool-result message, causing an OpenAI 400).


      await agent.run(
        buildPrompt(pullRequest, files, Boolean(prdId), acceptanceCriteria, userStories, mainPrd),
        {
          state,
          step,
          maxIter: 1,
        },
      );

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

      // The review ran (whether it reached a verdict or fell back to
      // needs_human_review) — either way it consumed one AI review credit.
      await step.run("record-ai-review-usage", () =>
        billingService.recordAiReviewUsage({ organizationId, reviewId, featureRequestId }),
      );

      // The review is done — the feature now awaits a human decision. Advance it to
      // `pending_approval` so it shows up in the reviewer's queue, but never stomp a
      // human-set state (approved/shipped/rejected/changes_requested) already on it.
      if (featureRequestId) {
        await step.run("advance-feature-to-pending-approval", async () => {
          const { featureRequest } = await featureRequestService.getFeatureRequestById({
            id: featureRequestId,
          });
          const decided = new Set([
            "pending_approval",
            "approved",
            "shipped",
            "rejected",
            "duplicate",
            "changes_requested",
          ]);
          if (featureRequest && !decided.has(featureRequest.status)) {
            await featureRequestService.updateFeatureRequest({
              id: featureRequestId,
              status: "pending_approval",
            });
          }
          return { advanced: true };
        });
      }

      return { reviewId, verdict: state.data.verdict ?? "needs_human_review" };
    });
  },
);
