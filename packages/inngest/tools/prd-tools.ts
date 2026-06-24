import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { prdService } from "../services";
import { runStep } from "../utils/run-step";

const stringArray = z.array(z.string());

export function createCreatePrdTool(params: { organizationId: string; featureRequestId: string }) {
  return createTool({
    name: "create_prd",
    description: "Create the PRD for this feature request. Call this exactly once.",
    parameters: z.object({
      title: z.string().min(1).max(200).describe("Title of the PRD"),
      problemStatement: z
        .string()
        .min(1)
        .describe("The underlying user/business problem in 2-4 sentences — the WHY, not a restatement of the request"),
      goals: stringArray.describe("2-5 bullet outcomes that define success"),
      nonGoals: stringArray.describe("Explicitly what is OUT of scope for this iteration"),
      edgeCases: stringArray.describe(
        "Concrete edge cases an engineer would otherwise miss (empty states, concurrent access, permission boundaries, scale limits)",
      ),
      assumptions: stringArray.describe("Anything treated as true but not explicitly confirmed"),
      successMetrics: stringArray.describe("Measurable signals that this shipped successfully"),
    }),
    handler: async (input, { network, step }) => {
      const { id } = await runStep(step, "create-prd", { ...params, ...input }, () =>
        prdService.createPrd({
          organizationId: params.organizationId,
          featureRequestId: params.featureRequestId,
          ...input,
        }),
      );

      if (!id) throw new Error("Failed to create PRD");

      network.state.data.prdId = id;

      return { success: true, prdId: id };
    },
  });
}

export function createAddUserStoryTool() {
  return createTool({
    name: "add_user_story",
    description:
      "Add a user story to the PRD created by create_prd. Call once per distinct user-facing capability.",
    parameters: z.object({
      asA: z.string().max(160).optional().describe("The role of the user, e.g. 'a logged-in admin'"),
      iWant: z.string().optional().describe("The capability they want"),
      soThat: z.string().optional().describe("The benefit they get from it"),
      narrative: z.string().optional().describe("Freeform narrative, if asA/iWant/soThat don't fit"),
      orderIndex: z
        .number()
        .int()
        .optional()
        .describe("Order this story should appear in, starting at 0, most foundational first"),
    }),
    handler: async (input, { network, step }) => {
      const prdId = network.state.data.prdId as string | undefined;
      if (!prdId) throw new Error("create_prd must be called before add_user_story");

      const { id } = await runStep(step, "add-user-story", { prdId, ...input }, () =>
        prdService.createUserStory({ prdId, ...input }),
      );

      return { success: true, id };
    },
  });
}

export function createAddAcceptanceCriteriaTool() {
  return createTool({
    name: "add_acceptance_criteria",
    description: "Add a testable, binary acceptance criterion to the PRD created by create_prd.",
    parameters: z.object({
      description: z
        .string()
        .min(1)
        .describe("A testable, pass/fail condition that must hold for the feature to be considered done"),
      userStoryId: z
        .uuid()
        .optional()
        .describe("The user story this criterion verifies, when there is a clear one-to-one mapping"),
      orderIndex: z.number().int().optional(),
    }),
    handler: async (input, { network, step }) => {
      const prdId = network.state.data.prdId as string | undefined;
      if (!prdId) throw new Error("create_prd must be called before add_acceptance_criteria");

      const { id } = await runStep(step, "add-acceptance-criteria", { prdId, ...input }, () =>
        prdService.createAcceptanceCriteria({ prdId, ...input }),
      );

      return { success: true, id };
    },
  });
}
