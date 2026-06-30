# ShipFlow AI

**An AI-assisted product delivery platform** — take a feature request all the way to shipped, with AI in the loop and a human at the gate:

> **Feature request → PRD → Tasks → Code (PR) → AI review → Human approval → Ship**

A customer request comes in, an AI analyst clarifies it and drafts a **PRD**, the PRD is broken into **tasks**, code lands as a **GitHub pull request**, an **AI reviewer** checks the diff against the PRD's acceptance criteria, and a **human approves** before the feature can **ship**. Every step is tracked per organization, project, and feature.

---

## Table of contents

- [Architecture](#architecture)
- [The delivery lifecycle](#the-delivery-lifecycle)
- [Tech stack](#tech-stack)
- [Monorepo layout](#monorepo-layout)
- [Getting started](#getting-started)
- [Commands](#commands)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Deployment](#deployment)
- [Code style](#code-style)

---

## Architecture

The most important structural fact: **the API server is separate from the Next.js app.** Unlike a typical T3 app, the tRPC router does **not** live in Next.js route handlers.

```
apps/web (Next.js client)            apps/api (Express server)
  pure tRPC client  ───────────────►   hosts the tRPC router:
  NEXT_PUBLIC_API_URL                    • tRPC      at /trpc
  credentials: "include"                 • REST      at /api      (trpc-to-openapi)
  types via @repo/trpc/client            • OpenAPI   at /openapi.json
                                         • API docs  at /docs     (Scalar)
```

- **`packages/trpc`** owns the entire tRPC router (`server/index.ts` → `serverRouter`) — the single source of truth for the API surface and its types.
- **`apps/api`** is a standalone **Express** server that hosts that router (`apps/api/src/server.ts`), bundled for production with **tsup** into a self-contained `dist/index.js`.
- **`apps/web`** is a **pure tRPC client** — no server router. It calls the external API at `NEXT_PUBLIC_API_URL`; types flow in via `import type { ServerRouter } from "@repo/trpc/client"`. (Auth is the exception — better-auth runs in the web app at `/api/auth/[...all]`.)

### Request flow (layering)

```
apps/api (Express host)
  └─ packages/trpc   server/routes/<feature>/route.ts   (tRPC procedures, zod I/O, OpenAPI meta)
       └─ packages/trpc/server/services                  (service singletons)
            └─ packages/services                          (domain logic as classes, e.g. ReviewService)
                 └─ packages/database                     (Drizzle client + schema/models)
```

Async work (PRD generation, task generation, AI review, GitHub webhooks) runs as **Inngest** workflows in `packages/inngest`.

Shared packages (`trpc`, `services`, `database`, `logger`, `auth`, `inngest`) are consumed as **raw TypeScript** (no build step) via subpath imports like `@repo/services/review`. `apps/api` bundles them with tsup; `apps/web` consumes them through Next.js.

---

## The delivery lifecycle

A feature request moves through a canonical status lifecycle
(`featureRequestStatusEnum`): `intake → clarifying → prd_drafting → prd_ready → planning → ready_for_development → in_development → in_review → pending_approval → approved → shipped` (plus `changes_requested`, `rejected`, `duplicate`).

1. **Intake & clarification** — a feature request is created; an AI analyst chats to clarify requirements (`requirement-clarification` workflow).
2. **PRD generation** — a structured PRD (problem, goals, non-goals, user stories, acceptance criteria) is generated (`prd-generation`).
3. **Tasks** — the PRD is broken into a task board (`task-generation`).
4. **Pull request** — code lands on GitHub; a webhook snapshots the PR + its diff into the DB (`github-webhook` → `github-pull-request`). PRs are shown **grouped by feature request**.
5. **AI review** (`ai-review`) — a `code-reviewer` agent (OpenAI `gpt-4o-mini`) reviews the PR diff against the linked PRD's goals/non-goals and acceptance criteria, and reports a verdict (`approved` / `changes_requested` / `commented` / `needs_human_review`), a readiness score, and line-cited issues (`blocking` / `non_blocking`).
   - **Automatic PRD matching** — if the PR isn't linked, a `prd-matcher` agent picks the right feature request from the repo's candidates; the review records the exact `reviewedSha`, `attempt`, and `model`, so the UI can flag stale reviews and new commits.
6. **Human approval → ship gate** — on the PR page a human **Approves / Requests changes / Rejects** (which transitions the feature's status). On the feature's **Review & Ship** page they can **Ship**, gated server-side: shipping requires a current `approved` decision **and** zero unresolved blocking issues. Shipping creates a **release** and flips the feature to `shipped`.
7. **Releases** — shipped features appear on the project's Releases page.

---

## Tech stack

| Area            | Tech                                                                                  |
| --------------- | ------------------------------------------------------------------------------------- |
| Monorepo        | Turborepo, pnpm workspaces                                                            |
| API             | Express 5, tRPC v11, `trpc-to-openapi`, Scalar API reference                          |
| Web             | Next.js 16 (App Router), React, Tailwind v4, shadcn/ui (`radix-nova`), TanStack Query |
| Auth            | better-auth (email/password + GitHub OAuth)                                           |
| Database        | Drizzle ORM over `node-postgres`, hosted **Neon** Postgres                            |
| AI              | Inngest **agent-kit** + OpenAI (`gpt-4o-mini`) for review, PRD & task generation      |
| GitHub          | Octokit (GitHub App: PRs, diffs, webhooks)                                            |
| Async workflows | Inngest                                                                               |
| Validation      | Zod (per-package env + all tRPC I/O)                                                  |

---

## Monorepo layout

```
apps/
  web/        Next.js client (App Router, shadcn/ui) — runs on :3000
  api/        Express server hosting the tRPC router  — runs on :8000

packages/
  trpc/       tRPC router (routes + service singletons) — the API source of truth
  services/   Domain logic as classes (feature-request, prd, task, pull-request,
              review, approval, release, organization, membership, github, …)
  database/   Drizzle client + schema/models + migrations (Neon Postgres)
  inngest/    Async workflows + AI agents (clarification, prd, tasks, ai-review, github)
  auth/       better-auth config (server + client)
  logger/     Shared logger
  eslint-config/      Shared flat ESLint configs (base / next-js / react-internal)
  typescript-config/  Shared tsconfig bases
```

Each domain in `packages/database/models/*` is one file (e.g. `feature-request.ts`, `prd.ts`, `pull-request.ts`, `review.ts`, `approval.ts`, `release.ts`), re-exported through `schema.ts`, with shared `enums.ts` and a `timestamps` helper.

---

## Getting started

**Prerequisites:** Node ≥ 18, pnpm 9, and a Postgres connection string (the project uses a hosted **Neon** database — there is no local/Docker Postgres).

```sh
# 1. Install
pnpm install

# 2. First-time env setup: copies .env.example → .env and symlinks the root
#    .env into every app/package.
./setup.sh

# 3. Fill in the root .env (see Environment variables below) — at minimum DATABASE_URL.

# 4. Apply the database schema
pnpm db:migrate

# 5. Run everything (web :3000, api :8000, Inngest dev)
pnpm dev
```

Open the app at **http://localhost:3000**, the API docs at **http://localhost:8000/docs**.

---

## Commands

All commands run from the repo root and are orchestrated by Turborepo (tasks are wrapped with `dotenv-cli` so the root `.env` loads).

| Command            | What it does                                                    |
| ------------------ | --------------------------------------------------------------- |
| `pnpm dev`         | Run all apps + Inngest in watch mode (`web` :3000, `api` :8000) |
| `pnpm build`       | Build all apps/packages (Next build + tsup bundle for the API)  |
| `pnpm lint`        | ESLint across the workspace                                     |
| `pnpm check-types` | Type-check (`tsc --noEmit`; web also runs `next typegen`)       |
| `pnpm format`      | Prettier over `**/*.{ts,tsx,md}`                                |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes                |
| `pnpm db:migrate`  | Apply migrations to the database                                |

Scoped runs use Turbo filters, e.g. `pnpm dev --filter=web` or `pnpm build --filter=@repo/api`.
From `packages/database`, `pnpm dev` opens **Drizzle Studio**.

> There is no test framework configured yet — add a `test` task to `turbo.json` and the relevant package if you introduce one.

---

## Environment variables

Each package validates its own env at import time with a local Zod schema (`env.ts`/`env.js`), which **throws on missing required values**. Add config to the **owning package's** schema. All values live in the root `.env` (symlinked into each package by `setup.sh`).

| Variable                                               | Owner               | Required    | Notes                                            |
| ------------------------------------------------------ | ------------------- | ----------- | ------------------------------------------------ |
| `DATABASE_URL`                                         | `packages/database` | ✅          | Neon Postgres connection string                  |
| `BETTER_AUTH_SECRET`                                   | `packages/auth`     | ✅          | better-auth signing secret                       |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`            | `packages/auth`     | ✅          | GitHub **OAuth** app (user login)                |
| `GITHUB_APP_ID`                                        | `packages/services` | ✅          | GitHub **App** (repo/PR access)                  |
| `GITHUB_APP_NAME`                                      | `packages/services` | ✅          | GitHub App slug (used to build install URL)      |
| `GITHUB_APP_PRIVATE_KEY`                               | `packages/services` | ✅          | GitHub App private key                           |
| `GITHUB_WEBHOOK_SECRET`                                | `packages/services` | ✅          | Verifies inbound GitHub webhooks                 |
| `GOOGLE_OAUTH_CLIENT_ID` / `_SECRET` / `_REDIRECT_URI` | `packages/services` | optional    | Google OAuth scaffold                            |
| `OPENAI_API_KEY`                                       | `packages/inngest`  | optional\*  | \*Required for AI review / PRD / task generation |
| `PORT`                                                 | `apps/api`          | optional    | API port (default 8000)                          |
| `NODE_ENV`                                             | `apps/api`          | optional    | `development` \| `prod` (default `development`)  |
| `BASE_URL`                                             | `apps/api`          | optional    | API base URL (default `http://localhost:8000`)   |
| `NEXT_PUBLIC_API_URL`                                  | `apps/web`          | recommended | URL of the API server (falls back to `/trpc`)    |
| `NEXT_PUBLIC_APP_URL`                                  | `apps/web`          | recommended | Web URL — used as the better-auth client base    |

Set `SKIP_ENV_VALIDATION=1` to bypass validation during builds (e.g. Docker / CI).

---

## Database

Drizzle ORM over `node-postgres`, connected to a hosted **Neon** Postgres via `DATABASE_URL`. The client is `db` from `packages/database/index.ts` (the schema is passed in, so the relational `db.query.*` API is available).

- Tables/models: `packages/database/models/*` — one file per domain, re-exported through `schema.ts`.
- Migrations: generated into `packages/database/drizzle/`.
- Workflow: edit a model → `pnpm db:generate` → `pnpm db:migrate`.

---

## Deployment

This is **two services** — deploy them separately:

### Web → Vercel

`apps/web` deploys natively to Vercel. Set Root Directory to `apps/web`, use pnpm (Turborepo auto-detected). Required env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `NEXT_PUBLIC_API_URL` (the deployed API URL), `NEXT_PUBLIC_APP_URL` (the web URL). Use `SKIP_ENV_VALIDATION=1` for the build if not all are present at build time.

### API → a Node host (Railway / Render / Fly.io)

`apps/api` is a long-running Express server (receives GitHub webhooks, serves the Inngest endpoint), so it is **not** a good fit for Vercel's serverless model. Deploy it to a persistent Node host:

- Build: `pnpm build` → Start: `pnpm start` (`node dist/index.js`) — the tsup bundle is self-contained.
- Set all API-side env vars (DB, auth, GitHub App, OpenAI, `NODE_ENV=prod`, `BASE_URL`).

### Production checklist

- **CORS** — the API uses `credentials: "include"`; allow your Vercel web origin.
- **GitHub App + OAuth callback URLs** — point them (and the webhook URL) at your prod domains.
- **Inngest** — wire an Inngest Cloud app to the API's `/api/inngest` endpoint (the local `inngest-cli dev` is dev-only).
- Both services share the same Neon `DATABASE_URL`.

---

## Code style

Prettier (`prettier.config.js`): double quotes, semicolons, `printWidth: 100`, `trailingComma: "all"`, 2-space tabs, always-parenthesized arrow params. ESLint runs the flat config from `@repo/eslint-config`; `web` lints with `--max-warnings 0`.

**UI:** add components via the shadcn CLI (`pnpm dlx shadcn@latest add <name>` from `apps/web`) and compose the generated primitives — don't hand-write component primitives. Wire behavior to the better-auth client (`~/lib/auth-client`) and the typed tRPC hooks in `apps/web/hooks/api/<feature>/index.ts`.
