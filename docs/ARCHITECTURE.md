# ShipFlow AI — Architecture & Flow

AI‑assisted product delivery: **feature request → PRD → tasks → code → AI review → human approval → ship.**

The system is a Turborepo monorepo. The tRPC router is hosted by a standalone **Express** API (not Next.js), background work runs on **Inngest**, and GitHub is integrated as a **GitHub App** (installation tokens) with **better‑auth** handling user login.

> All diagrams below are [Mermaid](https://mermaid.js.org) — they render natively on GitHub and in most IDEs.

---

## 1. System architecture (layers)

```mermaid
flowchart LR
    subgraph client["Client"]
        B["Browser"]
    end

    subgraph web["apps/web · Next.js 16"]
        WUI["React UI · App Router"]
        WAUTH["better-auth client"]
        WTRPC["tRPC client · typed via ServerRouter"]
    end

    subgraph api["apps/api · Express host :8000"]
        TRPC_M["/trpc · tRPC"]
        REST_M["/api · REST (trpc-to-openapi)"]
        DOCS["/docs · /openapi.json (Scalar)"]
        INNGEST_M["/api/inngest"]
        WH["/webhooks/github · raw body"]
    end

    subgraph pkgs["Shared packages · consumed as raw TS"]
        PTRPC["@repo/trpc · router + routes"]
        PSVC["@repo/services · domain logic"]
        PDB["@repo/database · Drizzle ORM"]
        PAUTH["@repo/auth · better-auth"]
        PING["@repo/inngest · workflows + agents"]
        PLOG["@repo/logger"]
    end

    subgraph ext["External"]
        NEON[("Neon Postgres")]
        GH["GitHub App API"]
        OAI["OpenAI · agent-kit"]
    end

    B --> WUI
    WUI --> WAUTH
    WUI --> WTRPC
    WAUTH -->|"auth cookies"| api
    WTRPC -->|"credentials: include"| TRPC_M
    WTRPC --> REST_M

    TRPC_M --> PTRPC
    REST_M --> PTRPC
    DOCS --> PTRPC
    INNGEST_M --> PING
    WH --> PING

    PTRPC --> PSVC
    PTRPC --> PAUTH
    PSVC --> PDB
    PSVC -->|"installation Octokit"| GH
    PING --> PSVC
    PING --> OAI
    PAUTH --> PDB
    PDB --> NEON
    PSVC --> PLOG
```

**Layering (request → data):**

```
apps/api (Express host)
  └─ @repo/trpc   server/routes/<feature>/route.ts   · procedures, zod in/out, openapi meta
       └─ @repo/trpc   server/services/index.ts       · service singletons
            └─ @repo/services   <domain>/index.ts      · business logic (classes)
                 └─ @repo/database   models/*          · Drizzle client + schema → Neon
```

---

## 2. tRPC request lifecycle

Every procedure is dual‑purpose (tRPC at `/trpc` **and** REST at `/api`). Auth + org access are enforced before the service runs.

```mermaid
sequenceDiagram
    actor U as User
    participant W as apps/web · tRPC client
    participant E as apps/api · Express
    participant C as createContext
    participant P as authenticatedProcedure
    participant Z as zod .input()
    participant R as route
    participant S as service
    participant D as Drizzle → Neon

    U->>W: action
    W->>E: POST /trpc/... (cookies)
    E->>C: getSession(headers)
    C-->>E: { user, session } or null
    alt no session
        E-->>W: 401 UNAUTHORIZED
    else authenticated
        E->>P: ctx.userId available
        P->>P: assertOrgAccess(userId, orgId, roles)
        P->>Z: parse input
        Z->>R: typed input
        R->>S: service.method(input)
        S->>D: query / mutation
        D-->>S: rows
        S-->>R: { data }
        R-->>W: zod .output() · typed result
    end
```

---

## 3. Authentication — better-auth (GitHub login)

better-auth handles **identity only** (login). Repo API access is a _separate_ concern (GitHub App, §5–6).

```mermaid
sequenceDiagram
    actor U as User
    participant W as apps/web
    participant BA as /api/auth/* · better-auth
    participant GH as GitHub OAuth
    participant DB as users · accounts · sessions

    U->>W: "Sign in with GitHub"
    W->>BA: /api/auth/sign-in/github
    BA->>GH: OAuth redirect (identity scopes)
    GH-->>U: consent screen
    U->>BA: /api/auth/callback/github?code
    BA->>GH: exchange code → token + profile
    BA->>DB: upsert user + account + session
    BA-->>U: Set-Cookie (session)
    Note over BA,DB: mapProfileToUser → fullName, email, avatar
```

---

## 4. GitHub App — installation flow (connect repos)

```mermaid
flowchart TD
    A["User clicks 'Connect GitHub'"] --> B["repository.getGithubInstallUrl<br/>state = organizationId"]
    B --> C["redirect → github.com/apps/&lt;slug&gt;/installations/new"]
    C --> D["user picks repositories · installs the App"]
    D --> E["GitHub redirects → /github/setup?installation_id&amp;state"]
    E --> F["repository.completeGithubInstallation<br/>(authenticated · MANAGE_ROLES)"]
    F --> G["githubService.listInstallationRepositories<br/>installation Octokit"]
    G --> H["repositoryService.upsertFromInstallation<br/>onConflictDoUpdate (org, githubRepoId)"]
    H --> I[("repositories<br/>githubInstallationId · connectedByUserId")]
```

**Why an App (not the login token):** acts as a **bot**, works in background jobs with **no user session**, per‑repo least privilege, and managed webhooks — matching the `githubInstallationId` / `webhookSecret` columns already in the schema.

---

## 5. Webhook → AI review (the core event chain)

The heart of the system. One thin **recorder** function fans out to a dedicated **PR** function, which snapshots the diff and asks for a review.

```mermaid
flowchart TD
    PR["PR opened / synchronize / reopened (GitHub)"] -->|"HTTP POST"| WH["/webhooks/github<br/>Express · express.raw (before json)"]
    WH --> SIG{"HMAC valid?<br/>app.webhooks.verify"}
    SIG -->|no| R401["401 · reject"]
    SIG -->|yes| SEND["inngest.send 'github/webhook.received'<br/>{ eventName, deliveryId, payload }"]

    SEND --> F1["fn: github-webhook"]
    F1 --> REC["step.run · webhookService.recordGithubDelivery<br/>TXN: resolve repo + insert · dedupe on deliveryId"]
    REC --> WET[("webhook_events")]
    REC --> DUP{"duplicate<br/>or repo not connected?"}
    DUP -->|yes| STOP["stop (idempotent)"]
    DUP -->|"no · pull_request"| EMIT["step.sendEvent 'github/pull_request'"]

    EMIT --> F2["fn: github-pull-request"]
    F2 --> FETCH["githubService.getPullRequest + listPullRequestFiles<br/>installation Octokit"]
    FETCH --> SNAP["pullRequestService.snapshotPullRequest<br/>TXN: upsert PR + replace files"]
    SNAP --> PRT[("pull_requests · pull_request_files")]
    SNAP --> REQ["step.sendEvent 'pull-request/review.requested'<br/>{ pullRequestId, organizationId }"]

    REQ --> F3["fn: ai-review"]
    F3 --> AG["code-reviewer agent · agent-kit + OpenAI<br/>diff vs PRD + acceptance criteria"]
    AG --> TOOLS["tools: report_issue · submit_verdict"]
    TOOLS --> RVW[("reviews · review_issues")]
    AG --> POST["post review back to the GitHub PR"]
```

**Under-the-hood guarantees**

| Concern     | How                                                                             |
| ----------- | ------------------------------------------------------------------------------- |
| Signature   | `express.raw` mounted **before** `express.json()` so HMAC runs on exact bytes   |
| Idempotency | `onConflictDoNothing(deliveryId)` → re-deliveries return `duplicate: true`      |
| Atomicity   | `recordGithubDelivery` & `snapshotPullRequest` each run in one `db.transaction` |
| Freshness   | file snapshot is **replaced** on each push, so deleted files don't linger       |
| Isolation   | each stage is its own Inngest function → independent retries / rate limits      |
| ESM/CJS     | `octokit` v5 (ESM-only) loaded via dynamic `import()` from the CJS service      |

---

## 6. Product lifecycle (domain event flow)

```mermaid
flowchart LR
    FR["Feature Request"] -->|"feature-request/created"| RC["fn: requirement-clarification<br/>requirements-analyst agent"]
    RC -->|"ask_question"| USR["clarify w/ user"]
    USR -->|"feature-request/clarification.replied"| RC
    RC -->|"mark_ready_for_prd ·<br/>feature-request/prd.requested"| PG["fn: prd-generation<br/>prd-writer agent"]
    PG --> PRD[("prds · user_stories · acceptance_criteria")]
    PRD -->|"approve →<br/>prd/tasks.requested"| TG["fn: task-generation<br/>task-planner agent"]
    TG --> TASKS[("tasks board")]
    TASKS --> CODE["code · human / agent"]
    CODE --> OPENPR["open Pull Request"]
    OPENPR -.->|"webhook chain · §5"| REVIEW["AI review"]
    REVIEW --> APPROVE["human approval"]
    APPROVE --> SHIP["release / ship"]
```

---

## 7. Inngest event bus (producers → events → consumers)

Everything async is decoupled through named events. Routes/controllers **emit**; functions **consume** and re-emit the next event.

```mermaid
flowchart LR
    subgraph producers["Producers"]
        R_FR["route: feature-request"]
        R_PRD["route: prd"]
        R_PR["route: pull-request"]
        C_GH["controller: github webhook"]
    end

    R_FR -->|"feature-request/created"| FN_RC["fn requirement-clarification"]
    R_FR -->|"feature-request/clarification.replied"| FN_RC
    FN_RC -->|"feature-request/prd.requested"| FN_PRD["fn prd-generation"]
    R_PRD -->|"prd/tasks.requested"| FN_TASK["fn task-generation"]
    C_GH -->|"github/webhook.received"| FN_WH["fn github-webhook"]
    FN_WH -->|"github/pull_request"| FN_GHPR["fn github-pull-request"]
    FN_GHPR -->|"pull-request/review.requested"| FN_AIR["fn ai-review"]
    R_PR -->|"pull-request/review.requested"| FN_AIR
```

| Event                                   | Emitted by                                    | Consumed by                 |
| --------------------------------------- | --------------------------------------------- | --------------------------- |
| `feature-request/created`               | feature-request route                         | `requirement-clarification` |
| `feature-request/clarification.replied` | feature-request route                         | `requirement-clarification` |
| `feature-request/prd.requested`         | `requirement-clarification` fn                | `prd-generation`            |
| `prd/tasks.requested`                   | prd route                                     | `task-generation`           |
| `github/webhook.received`               | github controller                             | `github-webhook`            |
| `github/pull_request`                   | `github-webhook` fn                           | `github-pull-request`       |
| `pull-request/review.requested`         | `github-pull-request` fn · pull-request route | `ai-review`                 |
| `test/hello.world`                      | —                                             | `hello-world`               |

---

## 8. Agents & tools (agent-kit)

AI functions drive **agents** that act only through typed **tools** (each tool writes to the DB via a service).

```mermaid
flowchart TD
    subgraph A1["requirements-analyst"]
        T1["ask_question · mark_ready_for_prd · mark_rejected"]
    end
    subgraph A2["prd-writer"]
        T2["create_prd · add_user_story · add_acceptance_criteria"]
    end
    subgraph A3["task-planner"]
        T3["create_task"]
    end
    subgraph A4["code-reviewer"]
        T4["report_issue · submit_verdict"]
    end
    T1 --> FRS["FeatureRequestService"]
    T2 --> PRDS["PrdService"]
    T3 --> TSKS["TaskService"]
    T4 --> RVS["ReviewService"]
```

---

## 9. API surface (tRPC route groups)

`auth · user · organization · membership · project · feature-request · prd · task · repository · pull-request · review · approval · release · billing · webhook · workflow · health`

Each is `server/routes/<group>/route.ts` (procedures + openapi meta) backed by a `@repo/services/<group>` class. Add an endpoint by editing `@repo/trpc`; the Express host and the typed web client both pick it up via the shared `ServerRouter` type.

---

## Legend

```mermaid
flowchart LR
    A["process / function"] --> B[("database table")]
    C{"decision"} -->|"event / label"| D["next step"]
```

- **Rectangle** — a function, route, or service call
- **Cylinder** — a Postgres table
- **Diamond** — a branch / guard
- **Dashed edge** — crosses into another flow (e.g. the webhook chain)
