import { createTool, type Tool } from "@inngest/agent-kit";
import { z } from "zod";
import {
  issueCategorySchema,
  issueSeveritySchema,
  reviewVerdictSchema,
} from "@repo/services/review/model";
import { reviewService } from "../services";
import { runStep } from "../utils/run-step";

/**
 * A single tool that submits the ENTIRE review — all issues plus the verdict — in
 * one call.
 *
 * This is deliberately not per-issue: agent-kit's multi-iteration loop drops
 * tool-result messages from the history it sends to the next inference, which
 * makes OpenAI reject the follow-up call ("tool_call_ids did not have response
 * messages"). Submitting everything in one call lets the reviewer run at
 * maxIter: 1, so there is never a second inference to corrupt. Every nested issue
 * field is required-but-nullable for OpenAI strict mode.
 */
export function createSubmitReviewTool(reviewId: string): Tool.Any {
  return createTool({
    name: "submit_review",
    description:
      "Submit the complete review — every issue found plus the final verdict — in one call. Call exactly once.",
    parameters: z.object({
      verdict: reviewVerdictSchema.describe(
        "approved (no blocking issues) | changes_requested (blocking issues exist) | commented (only non-blocking issues) | needs_human_review (can't confidently assess, or PRD/criteria missing or contradictory)",
      ),
      summary: z
        .string()
        .min(1)
        .describe("2-4 sentences a human approver can read instead of the full diff"),
      readinessScore: z
        .number()
        .int()
        .min(0)
        .max(100)
        .describe("Honest estimate (0-100) of how ready this is to ship as-is"),
      issues: z
        .array(
          z.object({
            severity: issueSeveritySchema.describe(
              "blocking (must fix before merge: incorrect behavior, security/privacy, data loss, failed acceptance criterion) | non_blocking",
            ),
            category: issueCategorySchema.describe(
              "prd_requirement | acceptance_criteria (set acceptanceCriteriaId) | engineering_task (set taskId) | security | performance | edge_case | code_quality | best_practice",
            ),
            title: z
              .string()
              .max(300)
              .describe("One-line summary specific enough to act on without the description"),
            description: z
              .string()
              .min(1)
              .describe("What's wrong, with the exact filePath/lineStart/lineEnd"),
            rationale: z
              .string()
              .nullable()
              .describe("Why it matters — what breaks or what risk it creates; null if obvious"),
            suggestion: z
              .string()
              .nullable()
              .describe("A concrete fix, not just 'consider improving this'; null if none"),
            filePath: z.string().nullable(),
            lineStart: z.number().int().nullable(),
            lineEnd: z.number().int().nullable(),
            acceptanceCriteriaId: z
              .uuid()
              .nullable()
              .describe("Set when category is acceptance_criteria, else null"),
            taskId: z
              .uuid()
              .nullable()
              .describe("Set when category is engineering_task, else null"),
          }),
        )
        .describe("Every problem found in the diff. Empty array if the diff is clean."),
    }),
    handler: async ({ verdict, summary, readinessScore, issues }, { network, step }) => {
      for (const [i, issue] of issues.entries()) {
        await runStep(step, "report-issue", { reviewId, i, ...issue }, () =>
          reviewService.createReviewIssue({ reviewId, ...issue }),
        );
      }

      await runStep(step, "submit-verdict", { reviewId, verdict, summary, readinessScore }, () =>
        reviewService.updateReview({
          id: reviewId,
          status: "completed",
          verdict,
          summary,
          readinessScore,
        }),
      );

      network.state.data.verdict = verdict;
      network.state.data.summary = summary;
      network.state.data.readinessScore = readinessScore;

      return { success: true, issueCount: issues.length };
    },
  });
}
