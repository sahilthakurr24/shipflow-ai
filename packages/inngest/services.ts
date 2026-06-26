import FeatureRequestService from "@repo/services/feature-request";
import PrdService from "@repo/services/prd";
import TaskService from "@repo/services/task";
import ReviewService from "@repo/services/review";
import WorkflowService from "@repo/services/workflow";
import PullRequestService from "@repo/services/pull-request";
import WebhookService from "@repo/services/webhook";
import GithubService from "@repo/services/github";

export const featureRequestService = new FeatureRequestService();
export const prdService = new PrdService();
export const taskService = new TaskService();
export const reviewService = new ReviewService();
export const workflowService = new WorkflowService();
export const pullRequestService = new PullRequestService();
export const webhookService = new WebhookService();
export const githubService = new GithubService();
