import { boolean, index, pgTable, text, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { repositoryProviderEnum } from "./enums";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { projectsTable } from "./project";
import { usersTable } from "./user";

/**
 * A GitHub repository connected to the workspace. External numeric GitHub IDs
 * are stored as text to avoid integer-overflow surprises. `webhookSecret` is
 * per-repo so inbound webhook payloads can be signature-verified.
 */
export const repositoriesTable = pgTable(
  "repositories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projectsTable.id, { onDelete: "set null" }),
    provider: repositoryProviderEnum("provider").notNull().default("github"),
    githubRepoId: varchar("github_repo_id", { length: 64 }).notNull(),
    githubInstallationId: varchar("github_installation_id", { length: 64 }),
    owner: varchar("owner", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 512 }).notNull(),
    defaultBranch: varchar("default_branch", { length: 255 }).notNull().default("main"),
    isPrivate: boolean("is_private").notNull().default(false),
    htmlUrl: text("html_url"),
    webhookSecret: text("webhook_secret"),
    connectedByUserId: uuid("connected_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("repositories_org_github_repo_unique").on(t.organizationId, t.githubRepoId),
    index("repositories_org_idx").on(t.organizationId),
  ],
);

export type SelectRepository = typeof repositoriesTable.$inferSelect;
export type InsertRepository = typeof repositoriesTable.$inferInsert;
