import { createState } from "@inngest/agent-kit";
import { NonRetriableError } from "inngest";
import { createTaskPlannerAgent } from "../agents/task-planner";
import { inngest } from "../client";
import { prdService } from "../services";
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

  return `PRD: ${prd.title}
Problem statement: ${prd.problemStatement ?? "(none)"}
Goals: ${(prd.goals ?? []).join("; ") || "(none)"}
Non-goals: ${(prd.nonGoals ?? []).join("; ") || "(none)"}
Edge cases: ${(prd.edgeCases ?? []).join("; ") || "(none)"}
Assumptions: ${(prd.assumptions ?? []).join("; ") || "(none)"}

User stories:
${storiesText}

Acceptance criteria:
${criteriaText}`;
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

        const { userStories } = await step.run("list-user-stories", () =>
          prdService.listUserStories({ prdId }),
        );
        const { acceptanceCriteria } = await step.run("list-acceptance-criteria", () =>
          prdService.listAcceptanceCriteria({ prdId }),
        );

        const agent = createTaskPlannerAgent({ organizationId, featureRequestId, prdId });
        const state = createState();
        await agent.run(buildPrompt(prd, userStories, acceptanceCriteria), {
          state,
          step,
          maxIter: 10,
        });

        return { prdId };
      },
    );
  },
);
