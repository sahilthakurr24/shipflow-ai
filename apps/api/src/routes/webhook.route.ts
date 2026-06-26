import express from "express";
import { handleGithubWebhook } from "../controller/github.controller";

const router = express.Router();

router.post("/github", express.raw({ type: "*/*" }), handleGithubWebhook);

export default router;
