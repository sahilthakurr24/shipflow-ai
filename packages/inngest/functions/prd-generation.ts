import { createState } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import { createPrdWriterAgent } from "../agents/prd-writer";
import { inngest } from "../client";
import { featureRequestService } from "../services";
import { getFeatureRequestRepoContext, withRepoContext } from "../utils/repo-context";
import { runTrackedWorkflow } from "../utils/workflow-run";

type PrdGenerationState = { prdId?: string };

type ClarificationMessage = { role: "agent" | "user"; content: string };
type FeatureRequest = {
  title: string;
  description: string;
  source: string | null;
  priority: string | null;
};

function buildPrompt(
  featureRequest: FeatureRequest,
  messages: ClarificationMessage[],
  repoContext: string,
) {
  const transcript = messages.length
    ? messages
        .map((m) => `${m.role === "agent" ? "Analyst" : "Requester"}: ${m.content}`)
        .join("\n")
    : "(no clarifying questions were needed)";

  return withRepoContext(
    `Feature request:
Title: ${featureRequest.title}
Description: ${featureRequest.description}
Source: ${featureRequest.source ?? "unknown"}
Priority: ${featureRequest.priority ?? "unknown"}

Clarification transcript:
${transcript}`,
    repoContext,
  );
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

        const repoContext = await step.run("get-repo-context", () =>
          getFeatureRequestRepoContext(featureRequestId),
        );

        const agent = createPrdWriterAgent({ organizationId, featureRequestId });
        const state = createState<PrdGenerationState>();
        // maxIter: 1 — the agent writes the whole PRD in a single forced
        // create_prd call, so there is no second inference (which agent-kit would
        // send without the tool-result message, causing an OpenAI 400).
        await agent.run(buildPrompt(featureRequest, messages, repoContext), {
          state,
          step,
          maxIter: 1,
        });

        if (!state.data.prdId) throw new Error("PRD writer agent did not create a PRD");

        // Advance the request out of the drafting state so the UI stops showing
        // the "Generating PRD" indicator and reveals the finished PRD.
        await step.run("mark-prd-ready", () =>
          featureRequestService.updateFeatureRequest({
            id: featureRequestId,
            status: "prd_ready",
          }),
        );

        return { prdId: state.data.prdId };
      },
    );
  },
);
