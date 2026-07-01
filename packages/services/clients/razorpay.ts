import Razorpay from "razorpay";
import { env } from "../env";

let razorpayClient: Razorpay | null = null;

export function getRazorPayClient() {
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  return razorpayClient;
}

/**
 * Verifies the `x-razorpay-signature` header against the raw webhook body using
 * RAZORPAY_WEBHOOK_SECRET. Must run on the exact bytes Razorpay sent, before any
 * JSON parsing — re-serializing the body can change byte order and invalidate
 * the signature.
 */
export function isRazorpaySignatureValid(rawBody: string, signature: string | undefined): boolean {
  if (!signature) {
    return false;
  }

  return Razorpay.validateWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
}

/**
 * The Razorpay Node SDK rejects with plain objects, not `Error` instances — e.g.
 * `{ statusCode: 401, error: "Unauthorized" }` or
 * `{ statusCode: 400, error: { description: "..." } }`. Left as-is, that empty
 * `.message` propagates all the way to a blank toast on the frontend. Wrap every
 * Razorpay SDK call in `try { ... } catch (err) { throw asRazorpayError(err); }`
 * so a real, readable `Error` is what actually travels through tRPC.
 */
export function asRazorpayError(err: unknown): Error {
  if (err instanceof Error) return err;

  if (err && typeof err === "object" && "error" in err) {
    const inner = (err as { error: unknown }).error;
    if (typeof inner === "string") return new Error(`Razorpay: ${inner}`);
    if (inner && typeof inner === "object" && "description" in inner) {
      const description = (inner as { description?: unknown }).description;
      if (typeof description === "string") return new Error(`Razorpay: ${description}`);
    }
  }

  return new Error("Razorpay request failed");
}
