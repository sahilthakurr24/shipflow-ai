import { createTool, type Tool } from "@inngest/agent-kit";
import { z } from "zod";

/**
 * A single tool that records which feature request a pull request belongs to.
 *
 * Mirrors the submit_review pattern: the matcher runs at maxIter: 1 with this
 * tool forced, so there is exactly one inference and no second call for
 * agent-kit to corrupt. The id is required-but-nullable for OpenAI strict mode —
 * `null` means "no candidate clearly matches".
 */
export function createSelectFeatureRequestTool(): Tool.Any {
  return createTool({
    name: "select_feature_request",
    description:
      "Record the single feature request this pull request implements. Call exactly once.",
    parameters: z.object({
      featureRequestId: z
        .string()
        .nullable()
        .describe(
          "The id of the ONE candidate feature request this PR implements, copied exactly from the candidate list. null if none of the candidates clearly matches.",
        ),
    }),
    handler: async ({ featureRequestId }, { network }) => {
      network.state.data.featureRequestId = featureRequestId ?? undefined;
      return { success: true, featureRequestId };
    },
  });
}
