import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { webhookProviderEnum } from "./enums";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { repositoriesTable } from "./repository";

/**
 * Raw inbound GitHub webhook deliveries. Persisted before processing so events
 * can be verified, de-duplicated (via `deliveryId`) and replayed. Org/repo are
 * nullable because they are resolved from the payload after receipt.
 */
export const webhookEventsTable = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: webhookProviderEnum("provider").notNull().default("github"),
    organizationId: uuid("organization_id").references(() => organizationsTable.id, {
      onDelete: "set null",
    }),
    repositoryId: uuid("repository_id").references(() => repositoriesTable.id, {
      onDelete: "set null",
    }),
    /** GitHub's `X-GitHub-Delivery` header — unique per delivery. */
    deliveryId: varchar("delivery_id", { length: 120 }),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    action: varchar("action", { length: 80 }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    processed: boolean("processed").notNull().default(false),
    processedAt: timestamp("processed_at"),
    error: text("error"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("webhook_events_delivery_unique").on(t.deliveryId),
    index("webhook_events_repository_idx").on(t.repositoryId),
  ],
);

export type SelectWebhookEvent = typeof webhookEventsTable.$inferSelect;
export type InsertWebhookEvent = typeof webhookEventsTable.$inferInsert;
