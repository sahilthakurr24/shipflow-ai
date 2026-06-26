import { Request, Response } from "express";
import { inngest } from "@repo/inngest";
import { isSignatureValid } from "../helper/isSignatureValid";

export async function handleGithubWebhook(req: Request, res: Response) {
  //signature is verified in raw bytes
  const payload = req.body.toString("utf8");
  const signature = req.get("x-hub-signature-256");
  const eventName = req.get("x-github-event");
  const deliveryId = req.get("x-github-delivery");

  const isValid = await isSignatureValid(payload, signature);

  if (!isValid) {
    return res.status(401).json({
      message: "Invalid signature",
    });
  }

  const data = JSON.parse(payload);

  await inngest.send({
    name: "github/webhook.received",
    data: {
      eventName,
      deliveryId,
      payload: data,
    },
  });

  return res.status(200).json({
    success: true,
  });
}
