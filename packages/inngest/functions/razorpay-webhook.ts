import { inngest } from "../client";
import { billingService, webhookService } from "../services";

type RazorpaySubscriptionEntity = {
  id?: string;
  current_start?: number | null;
  current_end?: number | null;
};

type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  method?: string;
};

type RazorpayWebhookEventData = {
  eventId?: string;
  eventType?: string;
  payload: {
    payload?: {
      subscription?: { entity?: RazorpaySubscriptionEntity };
      payment?: { entity?: RazorpayPaymentEntity };
    };
  };
};

function toDate(unixSeconds: number | null | undefined) {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000) : undefined;
}

export const razorpayWebhookFunction = inngest.createFunction(
  { id: "razorpay-webhook", triggers: [{ event: "razorpay/webhook.received" }] },
  async ({ event, step }) => {
    const { eventId, eventType, payload } = event.data as RazorpayWebhookEventData;

    const subscriptionEntity = payload.payload?.subscription?.entity;
    const paymentEntity = payload.payload?.payment?.entity;

    // Persist the raw delivery atomically + idempotently (dedupe on Razorpay's event id).
    const result = await step.run("record-webhook-event", () =>
      webhookService.recordRazorpayDelivery({
        deliveryId: eventId,
        eventType: eventType ?? "unknown",
        razorpaySubscriptionId: subscriptionEntity?.id,
        payload,
      }),
    );

    // A redelivered event (same event id) was already recorded — nothing to do.
    if (result.duplicate) {
      return { duplicate: true, eventId };
    }

    switch (eventType) {
      case "subscription.activated":
        if (subscriptionEntity?.id) {
          await step.run("activate-subscription", () =>
            billingService.activateSubscription({
              razorpaySubscriptionId: subscriptionEntity.id!,
              currentPeriodStart: toDate(subscriptionEntity.current_start),
              currentPeriodEnd: toDate(subscriptionEntity.current_end),
            }),
          );
        }
        break;

      case "subscription.charged":
        if (subscriptionEntity?.id) {
          await step.run("record-subscription-charged", () =>
            billingService.recordSubscriptionCharged({
              razorpaySubscriptionId: subscriptionEntity.id!,
              currentPeriodStart: toDate(subscriptionEntity.current_start),
              currentPeriodEnd: toDate(subscriptionEntity.current_end),
            }),
          );
        }
        break;

      case "subscription.pending":
      case "subscription.halted":
        if (subscriptionEntity?.id) {
          await step.run("mark-past-due", () =>
            billingService.markPastDue({ razorpaySubscriptionId: subscriptionEntity.id! }),
          );
        }
        break;

      case "subscription.cancelled":
      case "subscription.completed":
        if (subscriptionEntity?.id) {
          await step.run("finalize-cancellation", () =>
            billingService.finalizeCancellation({ razorpaySubscriptionId: subscriptionEntity.id! }),
          );
        }
        break;

      case "payment.captured":
        if (paymentEntity) {
          await step.run("record-payment-captured", () =>
            billingService.recordPaymentCaptured({
              razorpaySubscriptionId: subscriptionEntity?.id,
              razorpayPaymentId: paymentEntity.id,
              razorpayOrderId: paymentEntity.order_id,
              amount: paymentEntity.amount ?? 0,
              currency: paymentEntity.currency ?? "INR",
              status: "captured",
              method: paymentEntity.method,
            }),
          );
        }
        break;

      case "payment.failed":
        if (paymentEntity) {
          await step.run("record-payment-failed", () =>
            billingService.recordPaymentFailed({
              razorpaySubscriptionId: subscriptionEntity?.id,
              razorpayPaymentId: paymentEntity.id,
              razorpayOrderId: paymentEntity.order_id,
              amount: paymentEntity.amount ?? 0,
              currency: paymentEntity.currency ?? "INR",
              status: "failed",
              method: paymentEntity.method,
            }),
          );
          if (subscriptionEntity?.id) {
            await step.run("mark-past-due-after-failed-payment", () =>
              billingService.markPastDue({ razorpaySubscriptionId: subscriptionEntity.id! }),
            );
          }
        }
        break;

      default:
        // Unhandled event types no-op here — they're still persisted in
        // webhookEventsTable above for observability/debugging.
        break;
    }

    return { eventId, eventType };
  },
);
