import { aiReviewFunction } from "./ai-review";
import { helloWorld } from "./hello-world";
import { prdGenerationFunction } from "./prd-generation";
import { requirementClarificationFunction } from "./requirement-clarification";
import { taskGenerationFunction } from "./task-generation";
import { githubWebhookFunction } from "./github-webhook";
import { githubPullRequestFunction } from "./github-pull-request";

export const functions = [
  helloWorld,
  requirementClarificationFunction,
  prdGenerationFunction,
  taskGenerationFunction,
  aiReviewFunction,
  githubWebhookFunction,
  githubPullRequestFunction,
];
