import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Centralised Postgres enums shared across the schema. Keeping them in one
 * place avoids duplicate enum type names and keeps workflow states canonical.
 */

// ---------------------------------------------------------------------------
// Tenancy & billing
// ---------------------------------------------------------------------------
export const memberRoleEnum = pgEnum("member_role", ["owner", "admin", "member", "viewer"]);

export const planTierEnum = pgEnum("plan_tier", ["free", "pro", "enterprise"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trialing",
  "active",
  "past_due",
  "canceled",
  "incomplete",
  "expired",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "created",
  "authorized",
  "captured",
  "failed",
  "refunded",
]);

export const usageMetricEnum = pgEnum("usage_metric", [
  "ai_review",
  "prd_generation",
  "repository",
  "member",
  "feature_request",
]);

// ---------------------------------------------------------------------------
// Product discovery
// ---------------------------------------------------------------------------
export const featureRequestSourceEnum = pgEnum("feature_request_source", [
  "email",
  "support_ticket",
  "phone_call",
  "chat",
  "manual",
  "api",
  "other",
]);

/**
 * The canonical lifecycle of a feature as it moves through the ShipFlow loop:
 * intake → clarifying → PRD → planning → development → review → approval → shipped.
 */
export const featureRequestStatusEnum = pgEnum("feature_request_status", [
  "intake",
  "clarifying",
  "prd_drafting",
  "prd_ready",
  "planning",
  "ready_for_development",
  "in_development",
  "in_review",
  "changes_requested",
  "pending_approval",
  "approved",
  "shipped",
  "rejected",
  "duplicate",
]);

export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);

/** Outcome of the "should we even build this?" triage step. */
export const buildDecisionEnum = pgEnum("build_decision", [
  "pending",
  "build",
  "already_exists",
  "rejected",
]);

export const clarificationRoleEnum = pgEnum("clarification_role", ["agent", "user"]);

// ---------------------------------------------------------------------------
// PRD & planning
// ---------------------------------------------------------------------------
export const prdStatusEnum = pgEnum("prd_status", [
  "draft",
  "generating",
  "ready",
  "approved",
  "archived",
]);

export const taskTypeEnum = pgEnum("task_type", [
  "feature",
  "bug",
  "chore",
  "test",
  "docs",
  "spike",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "testing",
  "blocked",
  "done",
]);

// ---------------------------------------------------------------------------
// GitHub integration
// ---------------------------------------------------------------------------
export const repositoryProviderEnum = pgEnum("repository_provider", ["github"]);

export const pullRequestStateEnum = pgEnum("pull_request_state", [
  "open",
  "closed",
  "merged",
  "draft",
]);

export const pullRequestFileStatusEnum = pgEnum("pull_request_file_status", [
  "added",
  "modified",
  "removed",
  "renamed",
  "copied",
  "changed",
]);

// ---------------------------------------------------------------------------
// AI review loop
// ---------------------------------------------------------------------------
export const reviewTriggerEnum = pgEnum("review_trigger", [
  "pr_opened",
  "pr_synchronized",
  "manual",
  "re_review",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "canceled",
]);

export const reviewVerdictEnum = pgEnum("review_verdict", [
  "approved",
  "changes_requested",
  "commented",
  "needs_human_review",
]);

export const issueSeverityEnum = pgEnum("issue_severity", ["blocking", "non_blocking"]);

export const issueCategoryEnum = pgEnum("issue_category", [
  "prd_requirement",
  "acceptance_criteria",
  "engineering_task",
  "security",
  "performance",
  "edge_case",
  "code_quality",
  "best_practice",
]);

export const issueStatusEnum = pgEnum("issue_status", ["open", "resolved", "wont_fix", "ignored"]);

// ---------------------------------------------------------------------------
// Human approval & release
// ---------------------------------------------------------------------------
export const approvalDecisionEnum = pgEnum("approval_decision", [
  "approved",
  "rejected",
  "changes_requested",
]);

export const releaseStatusEnum = pgEnum("release_status", ["pending", "shipped", "rolled_back"]);

// ---------------------------------------------------------------------------
// Async workflows (Inngest)
// ---------------------------------------------------------------------------
export const workflowTypeEnum = pgEnum("workflow_type", [
  "requirement_clarification",
  "prd_generation",
  "task_generation",
  "repository_analysis",
  "pull_request_processing",
  "ai_review",
  "re_review",
  "release_readiness",
]);

export const workflowStatusEnum = pgEnum("workflow_status", [
  "pending",
  "running",
  "completed",
  "failed",
  "canceled",
]);

export const webhookProviderEnum = pgEnum("webhook_provider", ["github"]);
