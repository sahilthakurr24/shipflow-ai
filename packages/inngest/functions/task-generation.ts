import { createState } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import { createTaskPlannerAgent } from "../agents/task-planner";
import { inngest } from "../client";
import { featureRequestService, prdService } from "../services";
import { getFeatureRequestRepoContext, withRepoContext } from "../utils/repo-context";
import { runTrackedWorkflow } from "../utils/workflow-run";

type Prd = {
  title: string;
  problemStatement: string | null;
  goals: string[] | null;
  nonGoals: string[] | null;
  edgeCases: string[] | null;
  assumptions: string[] | null;
};
type UserStory = {
  asA: string | null;
  iWant: string | null;
  soThat: string | null;
  narrative: string | null;
  orderIndex: number | null;
};
type AcceptanceCriterion = { description: string; userStoryId: string | null };

function buildPrompt(
  prd: Prd,
  userStories: UserStory[],
  acceptanceCriteria: AcceptanceCriterion[],
  repoContext: string,
) {
  const storiesText = userStories.length
    ? userStories
        .map(
          (s) =>
            `- [${s.orderIndex ?? "?"}] As a ${s.asA ?? "user"}, I want ${s.iWant ?? "..."}, so that ${
              s.soThat ?? "..."
            }${s.narrative ? ` (${s.narrative})` : ""}`,
        )
        .join("\n")
    : "(no user stories)";

  const criteriaText = acceptanceCriteria.length
    ? acceptanceCriteria
        .map((c) => `- ${c.description}${c.userStoryId ? ` [story: ${c.userStoryId}]` : ""}`)
        .join("\n")
    : "(no acceptance criteria)";

  return withRepoContext(
    `PRD: ${prd.title}
Problem statement: ${prd.problemStatement ?? "(none)"}
Goals: ${(prd.goals ?? []).join("; ") || "(none)"}
Non-goals: ${(prd.nonGoals ?? []).join("; ") || "(none)"}
Edge cases: ${(prd.edgeCases ?? []).join("; ") || "(none)"}
Assumptions: ${(prd.assumptions ?? []).join("; ") || "(none)"}

User stories:
${storiesText}

Acceptance criteria:
${criteriaText}`,
    repoContext,
  );
}

export const taskGenerationFunction = inngest.createFunction(
  { id: "task-generation", triggers: [{ event: "prd/tasks.requested" }] },
  async ({ event, step }) => {
    const { prdId, organizationId, featureRequestId } = event.data as {
      prdId: string;
      organizationId: string;
      featureRequestId: string;
    };

    return runTrackedWorkflow(
      step,
      { organizationId, featureRequestId, type: "task_generation" },
      async () => {
        const { prd } = await step.run("get-prd", () => prdService.getPrdById({ id: prdId }));
        if (!prd) throw new NonRetriableError("PRD not found");

        // Tasks inherit the feature request's project so they land in its board.
        const { featureRequest } = await step.run("get-feature-request", () =>
          featureRequestService.getFeatureRequestById({ id: featureRequestId }),
        );
        const projectId = featureRequest?.projectId ?? undefined;

        const { userStories } = await step.run("list-user-stories", () =>
          prdService.listUserStories({ prdId }),
        );
        const { acceptanceCriteria } = await step.run("list-acceptance-criteria", () =>
          prdService.listAcceptanceCriteria({ prdId }),
        );

        const repoContext = await step.run("get-repo-context", () =>
          getFeatureRequestRepoContext(featureRequestId),
        );

        const agent = createTaskPlannerAgent({ organizationId, featureRequestId, prdId, projectId });
        const state = createState();
        // maxIter: 1 — the planner emits every task in a single forced create_tasks
        // call, so there is no second inference (which agent-kit would send without
        // the tool-result message, causing an OpenAI 400).
        await agent.run(buildPrompt(prd, userStories, acceptanceCriteria, repoContext), {
          state,
          step,
          maxIter: 1,
        });

        return { prdId };
      },
    );
  },
);
