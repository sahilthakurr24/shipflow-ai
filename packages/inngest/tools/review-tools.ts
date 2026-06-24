import { createTool, type Tool } from "@inngest/agent-kit";
import { z } from "zod";
import { issueCategorySchema, issueSeveritySchema, reviewVerdictSchema } from "@repo/services/review/model";
import { reviewService } from "../services";
import { runStep } from "../utils/run-step";

export function createReportIssueTool(reviewId: string): Tool.Any {
  return createTool({
    name: "report_issue",
    description: "Report one issue found in the diff. Call once per issue.",
    parameters: z.object({
      severity: issueSeveritySchema.describe(
        "blocking if it must be fixed before merge (incorrect behavior, security/privacy, data loss, failed acceptance criterion); non_blocking otherwise",
      ),
      category: issueCategorySchema.describe(
        "prd_requirement | acceptance_criteria (set acceptanceCriteriaId) | engineering_task (set taskId) | security | performance | edge_case | code_quality | best_practice",
      ),
      title: z.string().max(300).describe("A one-line summary specific enough to act on without reading the description"),
      description: z.string().min(1).describe("What's wrong, with the exact filePath/lineStart/lineEnd it occurs at"),
      rationale: z.string().optional().describe("Why it matters — what breaks or what risk it creates"),
      suggestion: z.string().optional().describe("A concrete fix, not just 'consider improving this'"),
      filePath: z.string().optional(),
      lineStart: z.number().int().optional(),
      lineEnd: z.number().int().optional(),
      acceptanceCriteriaId: z.uuid().optional().describe("Set when category is acceptance_criteria"),
      taskId: z.uuid().optional().describe("Set when category is engineering_task"),
    }),
    handler: async (input, { step }) => {
      const { id } = await runStep(step, "report-issue", { reviewId, ...input }, () =>
        reviewService.createReviewIssue({ reviewId, ...input }),
      );

      return { success: true, id };
    },
  });
}

export function createSubmitVerdictTool(reviewId: string): Tool.Any {
  return createTool({
    name: "submit_verdict",
    description: "Submit the final verdict for this review. Call exactly once, after reviewing every changed file.",
    parameters: z.object({
      verdict: reviewVerdictSchema.describe(
        "approved (no blocking issues) | changes_requested (blocking issues exist) | commented (only non-blocking issues) | needs_human_review (can't confidently assess, or PRD/criteria missing or contradictory)",
      ),
      summary: z.string().min(1).describe("2-4 sentences a human approver can read instead of the full diff"),
      readinessScore: z.number().int().min(0).max(100).describe("Honest estimate of how ready this is to ship as-is"),
    }),
    handler: async ({ verdict, summary, readinessScore }, { network, step }) => {
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

      return { success: true };
    },
  });
}
