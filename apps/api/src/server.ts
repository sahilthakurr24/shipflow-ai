import express from "express";
import { logger } from "@repo/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";
import { inngest, serve, functions } from "@repo/inngest";
import WebhookRouter from "./routes/webhook.route";
import { serverRouter, createContext } from "@repo/trpc/server";

import { env } from "./env";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "ShipFlow AI OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

if (env.NODE_ENV !== "prod") {
  app.use(
    cors({
      // Reflect the request origin (not "*") and allow credentials, so the web
      // app's cross-origin tRPC calls with `credentials: "include"` carry the
      // better-auth session cookie. Browsers reject "*" for credentialed requests.
      origin: true,
      credentials: true,
    }),
  );
}

//webhook router — must be mounted BEFORE express.json() so the raw request body
//stays intact for GitHub's HMAC signature verification
app.use("/webhooks", WebhookRouter);
app.use(express.json());
//inngest configuration
app.use("/api/inngest", serve({ client: inngest, functions }));

//test routes
app.get("/", (req, res) => {
  return res.json({ message: "ShipFlow AI is up and running..." });
});
app.get("/health", (req, res) => {
  return res.json({ message: "ShipFlow AI server is healthy", healthy: true });
});

//logging routes
logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
