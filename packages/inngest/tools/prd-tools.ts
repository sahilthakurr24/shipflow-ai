import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { prdService } from "../services";
import { runStep } from "../utils/run-step";

const stringArray = z.array(z.string());

/**
 * A single tool that writes the entire PRD — document fields, user stories, and
 * acceptance criteria — in ONE call.
 *
 * This is deliberately not split into per-item tools: agent-kit's multi-iteration
 * loop drops tool-result messages from the history it sends to the next inference
 * (chunk run loop sets `history = inference.output`, omitting `result.toolCalls`),
 * which makes OpenAI reject the follow-up call ("tool_call_ids did not have
 * response messages"). Doing everything in one call lets the agent run at
 * maxIter: 1, so there is never a second inference to corrupt.
 *
 * Stories and criteria are nested so the model can link a criterion to a story by
 * its array index, which we resolve to the real DB id after inserting the stories.
 * Every field is required-but-nullable for OpenAI strict mode (see model notes).
 */
export function createCreatePrdTool(params: { organizationId: string; featureRequestId: string }) {
  return createTool({
    name: "create_prd",
    description:
      "Write the complete PRD for this feature request in one call: the document, all user stories, and all acceptance criteria. Call this exactly once.",
    parameters: z.object({
      title: z.string().min(1).max(200).describe("Title of the PRD"),
      problemStatement: z
        .string()
        .min(1)
        .describe(
          "The underlying user/business problem in 2-4 sentences — the WHY, not a restatement of the request",
        ),
      goals: stringArray.describe("2-5 bullet outcomes that define success"),
      nonGoals: stringArray.describe("Explicitly what is OUT of scope for this iteration"),
      edgeCases: stringArray.describe(
        "Concrete edge cases an engineer would otherwise miss (empty states, concurrent access, permission boundaries, scale limits)",
      ),
      assumptions: stringArray.describe("Anything treated as true but not explicitly confirmed"),
      successMetrics: stringArray.describe("Measurable signals that this shipped successfully"),
      userStories: z
        .array(
          z.object({
            asA: z
              .string()
              .nullable()
              .describe("The role of the user, e.g. 'a logged-in admin'; null if not applicable"),
            iWant: z.string().nullable().describe("The capability they want; null if not applicable"),
            soThat: z
              .string()
              .nullable()
              .describe("The benefit they get from it; null if not applicable"),
            narrative: z
              .string()
              .nullable()
              .describe("Freeform narrative if asA/iWant/soThat don't fit; otherwise null"),
          }),
        )
        .describe(
          "One entry per distinct user-facing capability, most foundational first. Order in the array is the display order.",
        ),
      acceptanceCriteria: z
        .array(
          z.object({
            description: z
              .string()
              .min(1)
              .describe("A testable, pass/fail condition that must hold for the feature to be done"),
            userStoryIndex: z
              .number()
              .int()
              .nullable()
              .describe(
                "Index into the userStories array this criterion verifies (0-based), or null if it is cross-cutting (e.g. performance, security)",
              ),
          }),
        )
        .describe("Testable, binary conditions that define done. Order in the array is the display order."),
    }),
    handler: async (input, { network, step }) => {
      const { userStories, acceptanceCriteria, ...prdFields } = input;

      const { id: prdId } = await runStep(step, "create-prd", { ...params, ...prdFields }, () =>
        prdService.createPrd({
          organizationId: params.organizationId,
          featureRequestId: params.featureRequestId,
          ...prdFields,
        }),
      );

      if (!prdId) throw new Error("Failed to create PRD");

      // Insert stories in order, remembering each generated id so criteria can
      // be linked by their declared array index.
      const storyIds: string[] = [];
      for (const [i, story] of userStories.entries()) {
        const { id } = await runStep(step, "add-user-story", { prdId, i, ...story }, () =>
          prdService.createUserStory({ prdId, ...story, orderIndex: i }),
        );
        if (id) storyIds.push(id);
      }

      for (const [i, criterion] of acceptanceCriteria.entries()) {
        const userStoryId =
          criterion.userStoryIndex != null ? storyIds[criterion.userStoryIndex] : undefined;
        await runStep(step, "add-acceptance-criteria", { prdId, i, ...criterion }, () =>
          prdService.createAcceptanceCriteria({
            prdId,
            description: criterion.description,
            userStoryId,
            orderIndex: i,
          }),
        );
      }

      network.state.data.prdId = prdId;

      return { success: true, prdId, userStoryCount: storyIds.length };
    },
  });
}
