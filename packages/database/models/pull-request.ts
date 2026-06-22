import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { pullRequestFileStatusEnum, pullRequestStateEnum } from "./enums";
import { featureRequestsTable } from "./feature-request";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { repositoriesTable } from "./repository";

/**
 * A GitHub pull request implementing a feature. Hydrated from the GitHub API /
 * webhook payloads (never hardcoded). `headSha` is the commit the latest AI
 * review ran against, used to detect when a re-review is needed.
 */
export const pullRequestsTable = pgTable(
  "pull_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    repositoryId: uuid("repository_id")
      .notNull()
      .references(() => repositoriesTable.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id").references(() => featureRequestsTable.id, {
      onDelete: "set null",
    }),
    githubPrNumber: integer("github_pr_number").notNull(),
    githubPrId: varchar("github_pr_id", { length: 64 }),
    title: varchar("title", { length: 512 }).notNull(),
    body: text("body"),
    state: pullRequestStateEnum("state").notNull().default("open"),
    isDraft: boolean("is_draft").notNull().default(false),
    authorLogin: varchar("author_login", { length: 255 }),
    headBranch: varchar("head_branch", { length: 255 }),
    baseBranch: varchar("base_branch", { length: 255 }),
    headSha: varchar("head_sha", { length: 64 }),
    htmlUrl: text("html_url"),
    additions: integer("additions").notNull().default(0),
    deletions: integer("deletions").notNull().default(0),
    changedFilesCount: integer("changed_files_count").notNull().default(0),
    mergedAt: timestamp("merged_at"),
    closedAt: timestamp("closed_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("pull_requests_repo_number_unique").on(t.repositoryId, t.githubPrNumber),
    index("pull_requests_org_idx").on(t.organizationId),
    index("pull_requests_feature_request_idx").on(t.featureRequestId),
  ],
);

/**
 * A single file changed by a pull request, including its unified diff (`patch`)
 * so the AI reviewer can analyse the actual code changes.
 */
export const pullRequestFilesTable = pgTable(
  "pull_request_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pullRequestId: uuid("pull_request_id")
      .notNull()
      .references(() => pullRequestsTable.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    previousFilename: text("previous_filename"),
    status: pullRequestFileStatusEnum("status").notNull(),
    additions: integer("additions").notNull().default(0),
    deletions: integer("deletions").notNull().default(0),
    changes: integer("changes").notNull().default(0),
    patch: text("patch"),
    ...timestamps,
  },
  (t) => [index("pull_request_files_pull_request_idx").on(t.pullRequestId)],
);

export type SelectPullRequest = typeof pullRequestsTable.$inferSelect;
export type InsertPullRequest = typeof pullRequestsTable.$inferInsert;
export type SelectPullRequestFile = typeof pullRequestFilesTable.$inferSelect;
export type InsertPullRequestFile = typeof pullRequestFilesTable.$inferInsert;
