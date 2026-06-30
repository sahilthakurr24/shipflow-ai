import { createAgent } from "@inngest/agent-kit";
import { gpt4oMiniModel } from "../models";
import { createSelectFeatureRequestTool } from "../tools/prd-matcher-tools";

const system = `You match a GitHub pull request to the ONE feature request it implements, so the code
review can be graded against that feature's PRD.

WHAT YOU SEE
- The PR: its title, body, head branch name, and the paths of the files it changes.
- A numbered list of CANDIDATE feature requests, each with an id, title and description. Every
  candidate already has a PRD.

HOW TO DECIDE
- Pick the single candidate whose title/description best describes what this PR does. Use the PR
  title/body wording, the branch name (feature branches are often named after the work), and the
  changed file paths as evidence.
- Copy the chosen candidate's id EXACTLY as given. Never invent an id or pick one not in the list.
- If no candidate clearly matches — the PR is unrelated, ambiguous between several, or just chores —
  return null rather than guessing. A wrong link makes the review check the change against the wrong
  requirements, which is worse than no link.

Call select_feature_request exactly once with your choice (an id, or null).`;

export function createPrdMatcherAgent() {
  return createAgent({
    name: "prd-matcher",
    description:
      "Picks the one feature request a pull request implements, from a candidate list, so the review can use its PRD.",
    system,
    model: gpt4oMiniModel,
    // Force the single batched call so the matcher runs at maxIter: 1 (no second
    // inference — same constraint as the code reviewer).
    tool_choice: "select_feature_request",
    tools: [createSelectFeatureRequestTool()],
  });
}
