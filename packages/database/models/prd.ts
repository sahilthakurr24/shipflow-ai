import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { prdStatusEnum } from "./enums";
import { featureRequestsTable } from "./feature-request";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { usersTable } from "./user";

/**
 * A structured Product Requirements Document generated from a feature request.
 * Free-form list sections are stored as JSONB; user stories and acceptance
 * criteria are normalised into their own tables so AI review issues can
 * reference a specific criterion. PRDs are versioned per feature request.
 */
export const prdsTable = pgTable(
  "prds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    featureRequestId: uuid("feature_request_id")
      .notNull()
      .references(() => featureRequestsTable.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    status: prdStatusEnum("status").notNull().default("draft"),
    title: varchar("title", { length: 200 }).notNull(),
    problemStatement: text("problem_statement"),
    goals: jsonb("goals").$type<string[]>().notNull().default([]),
    nonGoals: jsonb("non_goals").$type<string[]>().notNull().default([]),
    edgeCases: jsonb("edge_cases").$type<string[]>().notNull().default([]),
    assumptions: jsonb("assumptions").$type<string[]>().notNull().default([]),
    successMetrics: jsonb("success_metrics").$type<string[]>().notNull().default([]),
    generatedByModel: varchar("generated_by_model", { length: 100 }),
    approvedByUserId: uuid("approved_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("prds_feature_request_version_unique").on(t.featureRequestId, t.version),
    index("prds_org_idx").on(t.organizationId),
    index("prds_feature_request_idx").on(t.featureRequestId),
  ],
);

/** "As a <role>, I want <capability>, so that <benefit>." */
export const userStoriesTable = pgTable(
  "user_stories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prdId: uuid("prd_id")
      .notNull()
      .references(() => prdsTable.id, { onDelete: "cascade" }),
    asA: varchar("as_a", { length: 160 }),
    iWant: text("i_want"),
    soThat: text("so_that"),
    /** Optional full narrative if the story does not fit the template. */
    narrative: text("narrative"),
    orderIndex: integer("order_index").notNull().default(0),
    ...timestamps,
  },
  (t) => [index("user_stories_prd_idx").on(t.prdId)],
);

/**
 * Testable acceptance criteria. Optionally tied to a single user story.
 * Review issues link back here to prove a requirement was (or was not) met.
 */
export const acceptanceCriteriaTable = pgTable(
  "acceptance_criteria",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    prdId: uuid("prd_id")
      .notNull()
      .references(() => prdsTable.id, { onDelete: "cascade" }),
    userStoryId: uuid("user_story_id").references(() => userStoriesTable.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull(),
    orderIndex: integer("order_index").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("acceptance_criteria_prd_idx").on(t.prdId),
    index("acceptance_criteria_user_story_idx").on(t.userStoryId),
  ],
);

export type SelectPrd = typeof prdsTable.$inferSelect;
export type InsertPrd = typeof prdsTable.$inferInsert;
export type SelectUserStory = typeof userStoriesTable.$inferSelect;
export type InsertUserStory = typeof userStoriesTable.$inferInsert;
export type SelectAcceptanceCriteria = typeof acceptanceCriteriaTable.$inferSelect;
export type InsertAcceptanceCriteria = typeof acceptanceCriteriaTable.$inferInsert;
