import express from "express";
import { handleGithubWebhook } from "../controller/github.controller";
import { handleRazorpayWebhook } from "../controller/razorpay.controller";

const router = express.Router();

router.post("/github", express.raw({ type: "*/*" }), handleGithubWebhook);
router.post("/razorpay", express.raw({ type: "*/*" }), handleRazorpayWebhook);

export default router;
