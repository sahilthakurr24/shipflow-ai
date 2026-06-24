import { createState } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import { createRequirementsAnalystAgent } from "../agents/requirements-analyst";
import { inngest } from "../client";
import { featureRequestService } from "../services";
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

function buildPrompt(featureRequest: FeatureRequest, messages: ClarificationMessage[]) {
  const transcript = messages.length
    ? messages.map((m) => `${m.role === "agent" ? "Analyst" : "Requester"}: ${m.content}`).join("\n")
    : "(no clarifying questions asked yet)";

  return `Feature request:
Title: ${featureRequest.title}
Description: ${featureRequest.description}
Source: ${featureRequest.source ?? "unknown"}
Priority: ${featureRequest.priority ?? "unknown"}

Clarification transcript so far:
${transcript}`;
}

// Hard backstop on total LLM turns — the system prompt instructs the agent to
// self-limit at 3 questions, this just guards against a misbehaving model.
const MAX_TURNS = 5;

export const requirementClarificationFunction = inngest.createFunction(
  { id: "requirement-clarification", triggers: [{ event: "feature-request/created" }] },
  async ({ event, step }) => {
    const { featureRequestId, organizationId } = event.data as {
      featureRequestId: string;
      organizationId: string;
    };

    return runTrackedWorkflow(
      step,
      { organizationId, featureRequestId, type: "requirement_clarification" },
      async () => {
        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const { featureRequest } = await step.run("get-feature-request", () =>
            featureRequestService.getFeatureRequestById({ id: featureRequestId }),
          );
          if (!featureRequest) throw new NonRetriableError("Feature request not found");

          const { messages } = await step.run("list-clarification-messages", () =>
            featureRequestService.listClarificationMessages({ featureRequestId }),
          );

          const agent = createRequirementsAnalystAgent(featureRequestId);
          const state = createState<ClarificationState>();
          await agent.run(buildPrompt(featureRequest, messages), { state, step, maxIter: 1 });

          const { decision } = state.data;

          if (decision === "ready_for_prd") {
            await step.sendEvent("send-prd-requested", {
              name: "feature-request/prd.requested",
              data: { featureRequestId, organizationId },
            });
            return { decision };
          }

          if (decision === "rejected") {
            return { decision };
          }

          const reply = await step.waitForEvent("wait-for-clarification-reply", {
            event: "feature-request/clarification.replied",
            match: "data.featureRequestId",
            timeout: "3d",
          });

          if (!reply) return { decision: "timed_out" };
        }

        return { decision: "exhausted" };
      },
    );
  },
);
