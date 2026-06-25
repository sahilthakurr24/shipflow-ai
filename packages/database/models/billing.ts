import {
  boolean,
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

import { paymentStatusEnum, planTierEnum, subscriptionStatusEnum, usageMetricEnum } from "./enums";
import { featureRequestsTable } from "./feature-request";
import { timestamps } from "./helpers";
import { organizationsTable } from "./organization";
import { reviewsTable } from "./review";

/**
 * One billing subscription per organization. Plan limits (repos, AI review
 * credits, seats) are denormalised onto the row so quota checks are a single
 * read. Razorpay identifiers link to the payment gateway.
 */
export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    plan: planTierEnum("plan").notNull().default("free"),
    status: subscriptionStatusEnum("status").notNull().default("trialing"),
    razorpayCustomerId: varchar("razorpay_customer_id", { length: 120 }),
    razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 120 }),
    razorpayPlanId: varchar("razorpay_plan_id", { length: 120 }),
    seats: integer("seats").notNull().default(1),
    repositoryLimit: integer("repository_limit").notNull().default(1),
    aiReviewCreditsTotal: integer("ai_review_credits_total").notNull().default(50),
    aiReviewCreditsUsed: integer("ai_review_credits_used").notNull().default(0),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex("subscriptions_org_unique").on(t.organizationId)],
);

/** A Razorpay payment/charge against an organization. Amounts are in paise. */
export const paymentsTable = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptionsTable.id, {
      onDelete: "set null",
    }),
    razorpayPaymentId: varchar("razorpay_payment_id", { length: 120 }),
    razorpayOrderId: varchar("razorpay_order_id", { length: 120 }),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("INR"),
    status: paymentStatusEnum("status").notNull(),
    method: varchar("method", { length: 40 }),
    description: text("description"),
    ...timestamps,
  },
  (t) => [
    index("payments_org_idx").on(t.organizationId),
    index("payments_razorpay_payment_idx").on(t.razorpayPaymentId),
  ],
);

/**
 * An append-only log of metered usage events (AI reviews, PRD generations,
 * etc.) for enforcing plan limits and showing usage in the UI.
 */
export const usageRecordsTable = pgTable(
  "usage_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    metric: usageMetricEnum("metric").notNull(),
    quantity: integer("quantity").notNull().default(1),
    featureRequestId: uuid("feature_request_id").references(() => featureRequestsTable.id, {
      onDelete: "set null",
    }),
    reviewId: uuid("review_id").references(() => reviewsTable.id, { onDelete: "set null" }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [
    index("usage_records_org_idx").on(t.organizationId),
    index("usage_records_metric_idx").on(t.metric),
  ],
);

export type SelectSubscription = typeof subscriptionsTable.$inferSelect;
export type InsertSubscription = typeof subscriptionsTable.$inferInsert;
export type SelectPayment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;
export type SelectUsageRecord = typeof usageRecordsTable.$inferSelect;
export type InsertUsageRecord = typeof usageRecordsTable.$inferInsert;
