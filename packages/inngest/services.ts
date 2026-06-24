import FeatureRequestService from "@repo/services/feature-request";
import PrdService from "@repo/services/prd";
import TaskService from "@repo/services/task";
import ReviewService from "@repo/services/review";
import WorkflowService from "@repo/services/workflow";
import PullRequestService from "@repo/services/pull-request";

export const featureRequestService = new FeatureRequestService();
export const prdService = new PrdService();
export const taskService = new TaskService();
export const reviewService = new ReviewService();
export const workflowService = new WorkflowService();
export const pullRequestService = new PullRequestService();
