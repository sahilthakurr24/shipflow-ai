import { aiReviewFunction } from "./ai-review";
import { helloWorld } from "./hello-world";
import { prdGenerationFunction } from "./prd-generation";
import { requirementClarificationFunction } from "./requirement-clarification";
import { taskGenerationFunction } from "./task-generation";
import { githubWebhookFunction } from "./github-webhook";

export const functions = [
  helloWorld,
  requirementClarificationFunction,
  prdGenerationFunction,
  taskGenerationFunction,
  aiReviewFunction,
  githubWebhookFunction
];
