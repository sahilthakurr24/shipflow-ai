import { Request, Response } from "express";
import { inngest } from "@repo/inngest";
import { isRazorpaySignatureValid } from "@repo/services/clients/razorpay";

export async function handleRazorpayWebhook(req: Request, res: Response) {
  //signature is verified against the raw bytes, before any JSON parsing
  const payload = req.body.toString("utf8");
  const signature = req.get("x-razorpay-signature");

  const isValid = isRazorpaySignatureValid(payload, signature);

  if (!isValid) {
    return res.status(401).json({
      message: "Invalid signature",
    });
  }

  const data = JSON.parse(payload);
  // Prefer Razorpay's dedicated event-id header; fall back to the payload's own
  // `id` field if the header isn't present on this account/event version. Verify
  // which one your account actually sends via the dashboard's webhook delivery log.
  const eventId = req.get("x-razorpay-event-id") ?? data.id;

  await inngest.send({
    name: "razorpay/webhook.received",
    data: {
      eventId,
      eventType: data.event,
      payload: data,
    },
  });

  return res.status(200).json({
    success: true,
  });
}
