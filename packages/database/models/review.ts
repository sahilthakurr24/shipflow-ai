import { index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import {
  issueCategoryEnum,
  issueSeverityEnum,
  issueStatusEnum,
  reviewStatusEnum,
  reviewTriggerEnum,
  reviewVerdictEnum,
} from "./enums";
import { acceptanceCriteriaTable, prdsTable } from "./prd";
import { featureRequestsTable } from "./feature-request";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { pullRequestsTable } from "./pull-request";
import { tasksTable } from "./task";

/**
 * One AI review run over a pull request, evaluated against the PRD, acceptance
 * criteria, tasks, security, performance, edge cases and code quality.
 * `attempt` increments on each re-review so the full review history is kept.
 * `readinessScore` is an optional 0-100 production-readiness signal.
 */
export const reviewsTable = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    pullRequestId: uuid("pull_request_id")
      .notNull()
      .references(() => pullRequestsTable.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id").references(() => featureRequestsTable.id, {
      onDelete: "set null",
    }),
    prdId: uuid("prd_id").references(() => prdsTable.id, { onDelete: "set null" }),
    attempt: integer("attempt").notNull().default(1),
    trigger: reviewTriggerEnum("trigger").notNull(),
    status: reviewStatusEnum("status").notNull().default("queued"),
    verdict: reviewVerdictEnum("verdict"),
    summary: text("summary"),
    model: varchar("model", { length: 100 }),
    readinessScore: integer("readiness_score"),
    /** The commit SHA this review evaluated; lets us detect stale reviews. */
    reviewedSha: varchar("reviewed_sha", { length: 64 }),
    blockingCount: integer("blocking_count").notNull().default(0),
    nonBlockingCount: integer("non_blocking_count").notNull().default(0),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    ...timestamps,
  },
  (t) => [
    index("reviews_org_idx").on(t.organizationId),
    index("reviews_pull_request_idx").on(t.pullRequestId),
    index("reviews_feature_request_idx").on(t.featureRequestId),
  ],
);

/**
 * A single finding from an AI review. `rationale` captures *why* the issue
 * exists (the agent must explain itself), and the optional links to an
 * acceptance criterion or task tie the finding back to a requirement.
 */
export const reviewIssuesTable = pgTable(
  "review_issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviewsTable.id, { onDelete: "cascade" }),
    severity: issueSeverityEnum("severity").notNull(),
    category: issueCategoryEnum("category").notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    description: text("description").notNull(),
    rationale: text("rationale"),
    suggestion: text("suggestion"),
    filePath: text("file_path"),
    lineStart: integer("line_start"),
    lineEnd: integer("line_end"),
    acceptanceCriteriaId: uuid("acceptance_criteria_id").references(
      () => acceptanceCriteriaTable.id,
      { onDelete: "set null" },
    ),
    taskId: uuid("task_id").references(() => tasksTable.id, { onDelete: "set null" }),
    status: issueStatusEnum("status").notNull().default("open"),
    /** ID of the comment posted back to GitHub, if any. */
    githubCommentId: varchar("github_comment_id", { length: 64 }),
    ...timestamps,
  },
  (t) => [
    index("review_issues_review_idx").on(t.reviewId),
    index("review_issues_severity_idx").on(t.severity),
  ],
);

export type SelectReview = typeof reviewsTable.$inferSelect;
export type InsertReview = typeof reviewsTable.$inferInsert;
export type SelectReviewIssue = typeof reviewIssuesTable.$inferSelect;
export type InsertReviewIssue = typeof reviewIssuesTable.$inferInsert;
