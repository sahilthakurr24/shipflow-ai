import { createState } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import { createPrdWriterAgent } from "../agents/prd-writer";
import { inngest } from "../client";
import { featureRequestService } from "../services";
import { runTrackedWorkflow } from "../utils/workflow-run";

type PrdGenerationState = { prdId?: string };

type ClarificationMessage = { role: "agent" | "user"; content: string };
type FeatureRequest = {
  title: string;
  description: string;
  source: string | null;
  priority: string | null;
};

function buildPrompt(featureRequest: FeatureRequest, messages: ClarificationMessage[]) {
  const transcript = messages.length
    ? messages
        .map((m) => `${m.role === "agent" ? "Analyst" : "Requester"}: ${m.content}`)
        .join("\n")
    : "(no clarifying questions were needed)";

  return `Feature request:
Title: ${featureRequest.title}
Description: ${featureRequest.description}
Source: ${featureRequest.source ?? "unknown"}
Priority: ${featureRequest.priority ?? "unknown"}

Clarification transcript:
${transcript}`;
}

export const prdGenerationFunction = inngest.createFunction(
  { id: "prd-generation", triggers: [{ event: "feature-request/prd.requested" }] },
  async ({ event, step }) => {
    const { featureRequestId, organizationId } = event.data as {
      featureRequestId: string;
      organizationId: string;
    };

    return runTrackedWorkflow(
      step,
      { organizationId, featureRequestId, type: "prd_generation" },
      async () => {
        const { featureRequest } = await step.run("get-feature-request", () =>
          featureRequestService.getFeatureRequestById({ id: featureRequestId }),
        );
        if (!featureRequest) throw new NonRetriableError("Feature request not found");

        const { messages } = await step.run("list-clarification-messages", () =>
          featureRequestService.listClarificationMessages({ featureRequestId }),
        );

        const agent = createPrdWriterAgent({ organizationId, featureRequestId });
        const state = createState<PrdGenerationState>();
        await agent.run(buildPrompt(featureRequest, messages), { state, step, maxIter: 10 });

        if (!state.data.prdId) throw new Error("PRD writer agent did not create a PRD");

        return { prdId: state.data.prdId };
      },
    );
  },
);
