import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { featureRequestService } from "../services";
import { runStep } from "../utils/run-step";

export function createAskQuestionTool(featureRequestId: string) {
  return createTool({
    name: "ask_question",
    description: "Ask the requester a single clarifying question about this feature request.",
    parameters: z.object({
      question: z
        .string()
        .min(1)
        .describe("The single highest-leverage clarifying question to ask"),
    }),
    handler: async ({ question }, { network, step }) => {
      await runStep(step, "ask-question", { featureRequestId, question }, async () => {
        await featureRequestService.addClarificationMessage({
          featureRequestId,
          role: "agent",
          content: question,
        });
        await featureRequestService.updateFeatureRequest({
          id: featureRequestId,
          status: "clarifying",
        });
      });

      network.state.data.decision = "ask_question";
      network.state.data.question = question;

      return { success: true };
    },
  });
}

export function createMarkReadyForPrdTool(featureRequestId: string) {
  return createTool({
    name: "mark_ready_for_prd",
    description: "Mark this feature request as ready to move into PRD drafting.",
    parameters: z.object({
      rationale: z
        .string()
        .min(1)
        .describe("Why this request is specific enough to write a PRD from"),
    }),
    handler: async ({ rationale }, { network, step }) => {
      await runStep(step, "mark-ready-for-prd", { featureRequestId, rationale }, () =>
        featureRequestService.updateFeatureRequest({
          id: featureRequestId,
          buildDecision: "build",
          buildDecisionRationale: rationale,
          status: "prd_drafting",
        }),
      );

      network.state.data.decision = "ready_for_prd";
      network.state.data.rationale = rationale;

      return { success: true };
    },
  });
}

export function createMarkRejectedTool(featureRequestId: string) {
  return createTool({
    name: "mark_rejected",
    description:
      "Reject this feature request because it duplicates existing functionality or is out of scope.",
    parameters: z.object({
      decision: z
        .enum(["already_exists", "rejected"])
        .describe("Why this request will not be built"),
      rationale: z.string().min(1).describe("One-sentence rationale for the decision"),
    }),
    handler: async ({ decision, rationale }, { network, step }) => {
      await runStep(step, "mark-rejected", { featureRequestId, decision, rationale }, () =>
        featureRequestService.updateFeatureRequest({
          id: featureRequestId,
          buildDecision: decision,
          buildDecisionRationale: rationale,
          status: decision === "already_exists" ? "duplicate" : "rejected",
        }),
      );

      network.state.data.decision = "rejected";
      network.state.data.rationale = rationale;

      return { success: true };
    },
  });
}
