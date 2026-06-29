import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";

import { invitationStatusEnum, memberRoleEnum } from "./enums";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { usersTable } from "./user";

/**
 * A pending invitation to join an organization. The invitee is identified by
 * `email` (they may not have an account yet); `token` backs a shareable invite
 * link (`/invite/<token>`). On accept, a membership is created with `role` and
 * the row flips to `accepted`. `expiresAt` bounds the link's validity.
 */
export const invitationsTable = pgTable(
  "invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: memberRoleEnum("role").notNull().default("member"),
    token: varchar("token", { length: 128 }).notNull(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    invitedByUserId: uuid("invited_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("invitations_token_unique").on(t.token),
    index("invitations_org_idx").on(t.organizationId),
    index("invitations_email_idx").on(t.email),
  ],
);

export type SelectInvitation = typeof invitationsTable.$inferSelect;
export type InsertInvitation = typeof invitationsTable.$inferInsert;
