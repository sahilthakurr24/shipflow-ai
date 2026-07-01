import { and, db, eq, sql } from "@repo/database";
import {
  membershipsTable,
  paymentsTable,
  plansTable,
  subscriptionsTable,
  usageRecordsTable,
  usersTable,
} from "@repo/database/schema";
import { asRazorpayError, getRazorPayClient } from "../clients/razorpay";
import { env } from "../env";
import {
  activateSubscriptionInput,
  ActivateSubscriptionInputType,
  billingOrganizationInput,
  BillingOrganizationInputType,
  cancelSubscriptionInput,
  CancelSubscriptionInputType,
  createCheckoutSubscriptionInput,
  CreateCheckoutSubscriptionInputType,
  finalizeCancellationInput,
  FinalizeCancellationInputType,
  markPastDueInput,
  MarkPastDueInputType,
  recordAiReviewUsageInput,
  RecordAiReviewUsageInputType,
  recordPaymentInput,
  RecordPaymentInputType,
  recordSubscriptionChargedInput,
  RecordSubscriptionChargedInputType,
} from "./model";

type PlanTier = "free" | "pro" | "enterprise";

// Seed values used only the first time a tier's row doesn't exist yet in `plans`
// (see `getPlanConfig`). After that, the `plans` table is the source of truth —
// edit a row there (e.g. Pro's `amount`) to change pricing, no code change needed.
const PLAN_DEFAULTS: Record<
  PlanTier,
  {
    name: string;
    description: string;
    amount: number | null;
    seats: number;
    repositoryLimit: number;
    aiReviewCreditsTotal: number;
  }
> = {
  free: {
    name: "Free",
    description: "For trying ShipFlow AI out.",
    amount: null,
    seats: 1,
    repositoryLimit: 1,
    aiReviewCreditsTotal: 50,
  },
  pro: {
    name: "Pro",
    description: "For teams shipping regularly.",
    amount: 99900,
    seats: 10,
    repositoryLimit: 10,
    aiReviewCreditsTotal: 500,
  },
  enterprise: {
    name: "Enterprise",
    description: "Custom limits, SSO, and support.",
    amount: null,
    seats: 100,
    repositoryLimit: 100,
    aiReviewCreditsTotal: 5000,
  },
};

/**
 * Subscription/payment lifecycle state (`status`, `plan`, captured payments) is only
 * ever written by the verified Razorpay webhook handler (see
 * packages/inngest/functions/razorpay-webhook.ts). `createCheckoutSubscription` and
 * `cancelSubscription` below only *initiate* actions with Razorpay — a client-side
 * checkout callback is not proof of payment, so neither method flips `status` itself.
 */
class BillingService {
  public async getSubscription(payload: BillingOrganizationInputType) {
    const { organizationId } = await billingOrganizationInput.parseAsync(payload);

    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.organizationId, organizationId));

    return { subscription };
  }

  public async listPayments(payload: BillingOrganizationInputType) {
    const { organizationId } = await billingOrganizationInput.parseAsync(payload);

    const payments = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.organizationId, organizationId));

    return { payments };
  }

  public async listUsageRecords(payload: BillingOrganizationInputType) {
    const { organizationId } = await billingOrganizationInput.parseAsync(payload);

    const usageRecords = await db
      .select()
      .from(usageRecordsTable)
      .where(eq(usageRecordsTable.organizationId, organizationId));

    return { usageRecords };
  }

  /**
   * Throws if the org has no AI review credits left this billing period. Called
   * from both the tRPC `requestReview` mutation (fail fast, good UX) and the
   * `ai-review.ts` Inngest function itself (the only place that also covers the
   * webhook-auto-triggered path, which never goes through tRPC).
   */
  public async assertAiReviewCredits(payload: BillingOrganizationInputType) {
    const { organizationId } = await billingOrganizationInput.parseAsync(payload);

    const subscription = await this.getOrCreateSubscription(organizationId);

    if (subscription.aiReviewCreditsUsed >= subscription.aiReviewCreditsTotal) {
      throw new Error("AI review credit limit reached for this billing period. Upgrade your plan to continue.");
    }
  }

  /**
   * Records one AI review's worth of usage: atomically increments the
   * subscription's counter (a SQL expression, not read-then-write, so concurrent
   * reviews for the same org can't race each other into an inconsistent count)
   * and appends to the usage log. Call only after a review run actually
   * completes — never before, since a client-triggered request is not the same
   * as the review having run.
   */
  public async recordAiReviewUsage(payload: RecordAiReviewUsageInputType) {
    const { organizationId, reviewId, featureRequestId } =
      await recordAiReviewUsageInput.parseAsync(payload);

    await db.transaction(async (tx) => {
      await tx
        .update(subscriptionsTable)
        .set({ aiReviewCreditsUsed: sql`${subscriptionsTable.aiReviewCreditsUsed} + 1` })
        .where(eq(subscriptionsTable.organizationId, organizationId));

      await tx.insert(usageRecordsTable).values({
        organizationId,
        metric: "ai_review",
        quantity: 1,
        reviewId,
        featureRequestId,
      });
    });
  }

  /** Every Razorpay SDK call goes through here so a plain-object rejection (the SDK's
   * default) becomes a real `Error` with a readable `.message` before it can reach
   * tRPC — otherwise the message is lost and the frontend shows a blank toast. */
  private async razorpayCall<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (err) {
      throw asRazorpayError(err);
    }
  }

  public async listPlans() {
    const plans = await db.select().from(plansTable).where(eq(plansTable.isActive, true));

    return { plans };
  }

  /**
   * Finds the DB row that owns pricing/limits for `tier`, lazily seeding it with
   * `PLAN_DEFAULTS` if it doesn't exist yet. This row — not Razorpay's dashboard —
   * is the source of truth: `razorpayPlanId` is populated on demand (see
   * `createCheckoutSubscription`) and cached here, never set by hand.
   */
  private async getPlanConfig(tier: PlanTier) {
    const [existing] = await db.select().from(plansTable).where(eq(plansTable.tier, tier));

    if (existing) return existing;

    const defaults = PLAN_DEFAULTS[tier];

    const [created] = await db
      .insert(plansTable)
      .values({ tier, ...defaults })
      .onConflictDoNothing({ target: plansTable.tier })
      .returning();

    if (created) return created;

    // Lost a race with a concurrent request that seeded the row first — re-read it.
    const [row] = await db.select().from(plansTable).where(eq(plansTable.tier, tier));

    if (!row) {
      throw new Error(`Failed to load or create plan config for tier ${tier}`);
    }

    return row;
  }

  /** Finds the org's 1:1 subscription row, lazily creating a "free" one if missing. */
  private async getOrCreateSubscription(organizationId: string) {
    const [existing] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.organizationId, organizationId));

    if (existing) return existing;

    const [created] = await db
      .insert(subscriptionsTable)
      .values({ organizationId, plan: "free" })
      .onConflictDoNothing({ target: subscriptionsTable.organizationId })
      .returning();

    if (created) return created;

    // Lost a race with a concurrent request that created the row first — re-read it.
    const [row] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.organizationId, organizationId));

    if (!row) {
      throw new Error(`Failed to load or create a subscription for organization ${organizationId}`);
    }

    return row;
  }

  /**
   * Starts a Pro upgrade: creates (or reuses) a Razorpay Customer for the org, lazily
   * syncs the "pro" row in `plans` to a real Razorpay Plan (no dashboard step — see
   * `getPlanConfig`), then creates a Razorpay Subscription against it. Returns what
   * the frontend needs to open Razorpay Checkout.js. Does NOT mark the subscription
   * active — that only happens once the `subscription.activated` webhook confirms
   * payment.
   */
  public async createCheckoutSubscription(payload: CreateCheckoutSubscriptionInputType) {
    const { organizationId } = await createCheckoutSubscriptionInput.parseAsync(payload);

    const subscription = await this.getOrCreateSubscription(organizationId);
    const razorpay = getRazorPayClient();

    let razorpayCustomerId = subscription.razorpayCustomerId;
    if (!razorpayCustomerId) {
      const [owner] = await db
        .select({ email: usersTable.email, fullName: usersTable.fullName })
        .from(membershipsTable)
        .innerJoin(usersTable, eq(membershipsTable.userId, usersTable.id))
        .where(
          and(
            eq(membershipsTable.organizationId, organizationId),
            eq(membershipsTable.role, "owner"),
          ),
        );

      const customer = await this.razorpayCall(() =>
        razorpay.customers.create({
          name: owner?.fullName ?? "ShipFlow AI organization",
          email: owner?.email,
          fail_existing: 0,
          notes: { organizationId },
        }),
      );

      razorpayCustomerId = customer.id;

      await db
        .update(subscriptionsTable)
        .set({ razorpayCustomerId })
        .where(eq(subscriptionsTable.id, subscription.id));
    }

    let proPlan = await this.getPlanConfig("pro");
    if (!proPlan.razorpayPlanId) {
      if (proPlan.amount === null) {
        throw new Error("The 'pro' plan has no amount configured — set plans.amount first.");
      }

      const planAmount = proPlan.amount;
      const razorpayPlan = await this.razorpayCall(() =>
        razorpay.plans.create({
          item: {
            name: proPlan.name,
            amount: planAmount,
            currency: proPlan.currency,
            description: proPlan.description ?? undefined,
          },
          period: proPlan.period,
          interval: proPlan.intervalCount,
        }),
      );

      const [updatedPlan] = await db
        .update(plansTable)
        .set({ razorpayPlanId: razorpayPlan.id })
        .where(eq(plansTable.id, proPlan.id))
        .returning();

      proPlan = updatedPlan ?? proPlan;
    }

    const proPlanRazorpayId = proPlan.razorpayPlanId!;
    const razorpaySubscription = await this.razorpayCall(() =>
      razorpay.subscriptions.create({
        plan_id: proPlanRazorpayId,
        customer_notify: 1,
        total_count: 12,
        notes: { organizationId },
      }),
    );

    await db
      .update(subscriptionsTable)
      .set({
        razorpaySubscriptionId: razorpaySubscription.id,
        razorpayPlanId: proPlan.razorpayPlanId,
      })
      .where(eq(subscriptionsTable.id, subscription.id));

    return {
      razorpaySubscriptionId: razorpaySubscription.id,
      razorpayKeyId: env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Requests cancellation with Razorpay. The local `status` still only flips to
   * "canceled" once the `subscription.cancelled` webhook arrives; this just records
   * the user's intent (`cancelAtPeriodEnd`) as a UI hint in the meantime.
   */
  public async cancelSubscription(payload: CancelSubscriptionInputType) {
    const { organizationId, cancelAtPeriodEnd } = await cancelSubscriptionInput.parseAsync(payload);

    const [subscription] = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.organizationId, organizationId));

    if (!subscription?.razorpaySubscriptionId) {
      throw new Error(`No Razorpay subscription found for organization ${organizationId}`);
    }

    const razorpay = getRazorPayClient();
    const razorpaySubscriptionId = subscription.razorpaySubscriptionId;
    await this.razorpayCall(() =>
      razorpay.subscriptions.cancel(razorpaySubscriptionId, cancelAtPeriodEnd),
    );

    const [updated] = await db
      .update(subscriptionsTable)
      .set({ cancelAtPeriodEnd })
      .where(eq(subscriptionsTable.id, subscription.id))
      .returning();

    return { subscription: updated };
  }

  // --- internal methods below: called only from the Razorpay webhook fan-out ---

  public async activateSubscription(payload: ActivateSubscriptionInputType) {
    const { razorpaySubscriptionId, currentPeriodStart, currentPeriodEnd } =
      await activateSubscriptionInput.parseAsync(payload);

    const proPlan = await this.getPlanConfig("pro");

    const [updated] = await db
      .update(subscriptionsTable)
      .set({
        plan: "pro",
        status: "active",
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
        aiReviewCreditsUsed: 0,
        seats: proPlan.seats,
        repositoryLimit: proPlan.repositoryLimit,
        aiReviewCreditsTotal: proPlan.aiReviewCreditsTotal,
      })
      .where(eq(subscriptionsTable.razorpaySubscriptionId, razorpaySubscriptionId))
      .returning();

    return { subscription: updated };
  }

  public async recordSubscriptionCharged(payload: RecordSubscriptionChargedInputType) {
    const { razorpaySubscriptionId, currentPeriodStart, currentPeriodEnd } =
      await recordSubscriptionChargedInput.parseAsync(payload);

    const [updated] = await db
      .update(subscriptionsTable)
      .set({
        status: "active",
        currentPeriodStart,
        currentPeriodEnd,
        aiReviewCreditsUsed: 0,
      })
      .where(eq(subscriptionsTable.razorpaySubscriptionId, razorpaySubscriptionId))
      .returning();

    return { subscription: updated };
  }

  public async markPastDue(payload: MarkPastDueInputType) {
    const { razorpaySubscriptionId } = await markPastDueInput.parseAsync(payload);

    const [updated] = await db
      .update(subscriptionsTable)
      .set({ status: "past_due" })
      .where(eq(subscriptionsTable.razorpaySubscriptionId, razorpaySubscriptionId))
      .returning();

    return { subscription: updated };
  }

  public async finalizeCancellation(payload: FinalizeCancellationInputType) {
    const { razorpaySubscriptionId } = await finalizeCancellationInput.parseAsync(payload);

    const freePlan = await this.getPlanConfig("free");

    const [updated] = await db
      .update(subscriptionsTable)
      .set({
        plan: "free",
        status: "canceled",
        cancelAtPeriodEnd: false,
        aiReviewCreditsUsed: 0,
        seats: freePlan.seats,
        repositoryLimit: freePlan.repositoryLimit,
        aiReviewCreditsTotal: freePlan.aiReviewCreditsTotal,
      })
      .where(eq(subscriptionsTable.razorpaySubscriptionId, razorpaySubscriptionId))
      .returning();

    return { subscription: updated };
  }

  public async recordPaymentCaptured(payload: RecordPaymentInputType) {
    return this.recordPayment(payload);
  }

  public async recordPaymentFailed(payload: RecordPaymentInputType) {
    return this.recordPayment(payload);
  }

  private async recordPayment(payload: RecordPaymentInputType) {
    const {
      razorpaySubscriptionId,
      razorpayPaymentId,
      razorpayOrderId,
      amount,
      currency,
      status,
      method,
      description,
    } = await recordPaymentInput.parseAsync(payload);

    let organizationId: string | undefined;
    let subscriptionId: string | undefined;

    if (razorpaySubscriptionId) {
      const [subscription] = await db
        .select({ id: subscriptionsTable.id, organizationId: subscriptionsTable.organizationId })
        .from(subscriptionsTable)
        .where(eq(subscriptionsTable.razorpaySubscriptionId, razorpaySubscriptionId));

      organizationId = subscription?.organizationId;
      subscriptionId = subscription?.id;
    }

    if (!organizationId) {
      // No matching subscription (e.g. a payment event that arrived before the
      // subscription row was linked) — nothing to attribute this payment to yet.
      return { payment: undefined };
    }

    // `razorpayPaymentId` is only plain-indexed (not unique), so there's no DB-level
    // conflict target here — idempotency for this insert relies on the caller
    // (the Inngest webhook function) already having deduped on the Razorpay event id
    // via `webhookEventsTable.deliveryId` before this method is ever invoked.
    const [payment] = await db
      .insert(paymentsTable)
      .values({
        organizationId,
        subscriptionId,
        razorpayPaymentId,
        razorpayOrderId,
        amount,
        currency,
        status,
        method,
        description,
      })
      .returning();

    return { payment };
  }
}

export default BillingService;
