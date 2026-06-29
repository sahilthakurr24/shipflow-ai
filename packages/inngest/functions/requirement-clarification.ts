import { createState } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import { createRequirementsAnalystAgent } from "../agents/requirements-analyst";
import { inngest } from "../client";
import { featureRequestService } from "../services";
import { getFeatureRequestRepoContext, withRepoContext } from "../utils/repo-context";
import { runTrackedWorkflow } from "../utils/workflow-run";

type ClarificationState = {
  decision?: "ask_question" | "ready_for_prd" | "rejected";
  question?: string;
  rationale?: string;
};

type ClarificationMessage = { role: "agent" | "user"; content: string };
type FeatureRequest = {
  title: string;
  description: string;
  source: string | null;
  priority: string | null;
};

// Question budget. The agent is *structurally* held to this range via tool
// gating (see below), so it can neither bail early nor loop forever.
const MIN_QUESTIONS = 2;
const MAX_QUESTIONS = 3;

// Only run the analyst while the request is still in the clarification stage.
const CLARIFYING_STATUSES = new Set(["intake", "clarifying"]);

function buildPrompt(
  featureRequest: FeatureRequest,
  messages: ClarificationMessage[],
  repoContext: string,
  { canAsk, canMarkReady }: { canAsk: boolean; canMarkReady: boolean },
) {
  const transcript = messages.length
    ? messages
        .map((m) => `${m.role === "agent" ? "Analyst" : "Requester"}: ${m.content}`)
        .join("\n")
    : "(no clarifying questions asked yet)";

  const questionsAsked = messages.filter((m) => m.role === "agent").length;
  const directive = !canMarkReady
    ? `You have asked ${questionsAsked} clarifying question(s). Ask your next highest-leverage question now, or use mark_rejected only if the request is clearly outside ShipFlow's scope.`
    : !canAsk
      ? `You have asked ${questionsAsked} clarifying questions — that is the limit. Make your decision now: call mark_ready_for_prd, or mark_rejected if it is genuinely out of scope.`
      : `You have asked ${questionsAsked} clarifying questions. If you now understand the problem, who is affected, what success looks like, and the constraints, call mark_ready_for_prd. Otherwise ask one more sharp question.`;

  return withRepoContext(
    `Feature request:
Title: ${featureRequest.title}
Description: ${featureRequest.description}
Source: ${featureRequest.source ?? "unknown"}
Priority: ${featureRequest.priority ?? "unknown"}

Clarification transcript so far:
${transcript}

Next action: ${directive}`,
    repoContext,
  );
}

/**
 * Drives the requirement-clarification conversation one turn at a time.
 *
 * Triggered both when a request is first created and every time the requester
 * replies. Each invocation runs the analyst agent exactly once — there is no
 * loop and no waitForEvent, so step IDs are never reused across turns (avoiding
 * Inngest's parallel-indexing warning) and the conversation is durable across
 * arbitrarily long gaps between replies.
 *
 * Termination is guaranteed by tool gating rather than the model's discretion:
 * below MIN_QUESTIONS it can only ask (or reject); at/above MAX_QUESTIONS it can
 * only finish (or reject). So the outcome is always ask / ready / rejected — it
 * can never "exhaust".
 */
export const requirementClarificationFunction = inngest.createFunction(
  {
    id: "requirement-clarification",
    // Serialize turns per request so two quick replies can't race.
    concurrency: { key: "event.data.featureRequestId", limit: 1 },
    triggers: [
      { event: "feature-request/created" },
      { event: "feature-request/clarification.replied" },
    ],
  },
  async ({ event, step }) => {
    const { featureRequestId } = event.data as { featureRequestId: string };

    const { featureRequest } = await step.run("get-feature-request", () =>
      featureRequestService.getFeatureRequestById({ id: featureRequestId }),
    );
    if (!featureRequest) throw new NonRetriableError("Feature request not found");

    // Idempotency: if the request already moved past clarification (ready,
    // rejected, or further along), ignore any stray reply event.
    if (!CLARIFYING_STATUSES.has(featureRequest.status)) {
      return { decision: "skipped", status: featureRequest.status };
    }

    const organizationId = featureRequest.organizationId;

    return runTrackedWorkflow(
      step,
      { organizationId, featureRequestId, type: "requirement_clarification" },
      async () => {
        const repoContext = await step.run("get-repo-context", () =>
          getFeatureRequestRepoContext(featureRequestId),
        );

        const { messages } = await step.run("list-clarification-messages", () =>
          featureRequestService.listClarificationMessages({ featureRequestId }),
        );

        const questionsAsked = messages.filter((m) => m.role === "agent").length;
        const canAsk = questionsAsked < MAX_QUESTIONS;
        const canMarkReady = questionsAsked >= MIN_QUESTIONS;

        const agent = createRequirementsAnalystAgent(featureRequestId, { canAsk, canMarkReady });
        const state = createState<ClarificationState>();
        await agent.run(
          buildPrompt(featureRequest, messages, repoContext, { canAsk, canMarkReady }),
          { state, step, maxIter: 1 },
        );

        let { decision } = state.data;

        // Backstop: if the model returned without calling any tool but we already
        // have enough context, move it forward rather than stalling. The tool
        // itself flips status to prd_drafting, so do it explicitly here.
        if (!decision && !canAsk) {
          await step.run("force-ready-for-prd", () =>
            featureRequestService.updateFeatureRequest({
              id: featureRequestId,
              buildDecision: "build",
              buildDecisionRationale:
                "Reached the clarifying-question limit; proceeding to PRD with the gathered context.",
              status: "prd_drafting",
            }),
          );
          decision = "ready_for_prd";
        }

        if (decision === "ready_for_prd") {
          await step.sendEvent("send-prd-requested", {
            name: "feature-request/prd.requested",
            data: { featureRequestId, organizationId },
          });
        }

        // ask_question / rejected need no further action here: the tool already
        // persisted the message and status; the next reply (or none) drives the
        // next turn.
        return { decision: decision ?? "awaiting_reply" };
      },
    );
  },
);
