# AGENTS.md — Agent Architecture & Operating Guide

This repository is organized for **agentic development** with a clear router/specialist pattern, strict output contracts, and a safety-first tool layer. Codex (and humans) should follow these rules to keep the project consistent, testable, and easy to extend.

---

## 0) TL;DR (for Codex & Humans)

**When starting any task:**
1. **Propose a Plan** in `docs/plans/<date>-<short-name>.md` with: goal, approach, files to change/create, tests, risks.
2. **Confirm the Plan** (unless in YOLO mode) before editing code.
3. **Implement** only the agreed plan. Keep each PR < 400 lines when possible.
4. **Add/Update Tests** (`/tests`) + **Run Lint/Typecheck** + **Record Evals** (`/evals`).
5. **Write/Update Docs** in `docs/` (esp. READMEs and this file if conventions evolve).
6. **Open a PR** with the checklist below and link the plan doc.

**Golden Rules**
- Never leak secrets. Only read from `.env` via typed config.
- Never run destructive tools without explicit approval (unless YOLO).
- Keep outputs structured. Follow the output contracts.
- Prefer small, incremental changes with tests over large refactors.

---

## 1) Repository Layout

.
├─ apps/ # Runnable apps (CLI, web, workers)
│ ├─ api/ # REST/RPC/WS adapter over services/agents
│ └─ web/ # Optional UI (Next.js/Vite/etc.)
├─ packages/
│ ├─ agents/ # Agent definitions, routers, specialists
│ │ ├─ router/ # Router/Orchestrator agent
│ │ ├─ specialists/ # Domain specialists (qa/, ops/, search/, etc.)
│ │ └─ shared/ # Shared prompts, state machines, guards
│ ├─ tools/ # Tool adapters (http, search, db, issues, etc.)
│ ├─ services/ # Deterministic business logic (pure functions)
│ ├─ core/ # LLM client, tracing, retries, cost/latency guards
│ └─ config/ # Typed config + schema validation
├─ evals/ # Evaluation specs, fixtures, regression tests
├─ tests/ # Unit/integration tests (vitest/jest)
├─ scripts/ # One-off scripts (scaffolding, migrations)
├─ docs/ # Playbooks, plans, ADRs (architecture decisions)
│ ├─ adr/ # Architecture Decision Records
│ └─ plans/ # Proposed plans per change
├─ .env.example # Template for required env vars
└─ AGENTS.md # You are here

yaml
Copy code

**Languages/Tooling (defaults):** TypeScript, pnpm, eslint, prettier, zod, vitest/jest, pino logging, OpenTelemetry optional.

---

## 2) Operating Modes

- **`propose` (default):** Plan required; destructive ops require approval.
- **`safe`**: Non-destructive only (read/search/generate).
- **`yolo`**: No prompts for approval; still respects safety guards in tools.

> **Codex:** Respect `CODEX_MODE` env or `--mode` flag. If absent, assume `propose`.

---

## 3) Agent Architecture

### 3.1 Router + Specialists

- **Router**: Does **routing only**, no heavy execution. Classifies intent, selects specialist(s), sequences tools.  
- **Specialists**: Focused roles (e.g., `qa`, `ops`, `search`, `data`, `frontend`). Each has:
  - A single responsibility
  - A stable **output contract** (zod schema)
  - Bounded tool access through guards
  - Clear error handling + retries

### 3.2 State & Memory

- Short-term state: In-flight task context (in-memory or per-request store).
- Long-term memory: Optional vector store (`/packages/core/vector`) with explicit write paths and TTLs.
- **No implicit memory writes**. Specialists must call `memory.write()` explicitly and justify in logs.

### 3.3 Output Contracts (zod)

Each agent/specialist returns **one** of:
- `success` with typed `data`
- `needs_approval` with `reason` and `proposal`
- `error` with actionable `remediation`

**Example:**
```ts
// packages/agents/shared/contracts.ts
import { z } from "zod";

export const AgentResult = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("success"),
    data: z.unknown(),
    costUsd: z.number().optional(),
    latencyMs: z.number().optional(),
    traceId: z.string().optional()
  }),
  z.object({
    status: z.literal("needs_approval"),
    reason: z.string(),
    proposal: z.any(),
    approvals: z.array(z.string()).default([]),
    traceId: z.string().optional()
  }),
  z.object({
    status: z.literal("error"),
    message: z.string(),
    remediation: z.string().optional(),
    traceId: z.string().optional()
  })
]);
export type AgentResult = z.infer<typeof AgentResult>;
4) Safety, Approvals, and Tool Gating
Tool capability flags: Each tool declares destructive: boolean, requiresApproval: boolean, quota, rlPolicy.

Central guard: All tool invocations go through packages/core/guard.ts. Enforce:

Rate limits, timeouts, retries (with jitter), circuit breaks

Redaction of secrets in logs

Cost/latency budgets

Approval flow:

When requiresApproval: true, agents return needs_approval with a clear plan:

What will be done

Files/resources affected

Rollback plan

Estimated cost/time

UI/CLI confirms → guard executes.

YOLO mode: Guard ignores approval prompts but keeps rate limits and redaction.

5) Models & Clients
Use packages/core/llm.ts for all model access.

Configure models via env:

OPENAI_API_KEY, DEFAULT_MODEL, REASONING_MODEL?

Fallbacks: prefer deterministic tools/services first; only then call LLMs.

Streaming & truncation: centralize in llm.ts, never reinvent per agent.

Never request chain-of-thought in outputs. Use internal reasoning; return summaries only.

6) Tools (Standard Adapters)
Place adapters in packages/tools/. Each tool exports:

ts
Copy code
export type ToolInput = z.infer<typeof InputSchema>;
export async function call(input: ToolInput, ctx: ToolContext): Promise<ToolResult>;
Baseline tools to scaffold first:

http (fetch with schema validation, retries)

web_search (search API wrapper with per-domain limits)

repo_fs (read/write within repo with allowlist globs)

issues (Plane/GitHub linearized via a common interface)

kv (key-value store; for small state)

vector (embed+search using provider of choice)

Every tool must declare: name, description, destructive, requiresApproval, limits, inputSchema, outputSchema.

7) Deterministic Services
Put business logic in packages/services/ as pure functions. Agents orchestrate; services compute.

Easy to test.

Cheap to run.

Reusable across specialists.

8) Config & Secrets
All config goes through packages/config/index.ts:

load .env

validate with zod

export typed cfg

Provide .env.example. Never commit real keys.

Redact secrets in logs by default.

9) Logging, Tracing, and Cost
Use pino for logs (packages/core/log.ts)

Include traceId, agent, tool, latencyMs, tokens, costUsd.

Optional OpenTelemetry exporter (OTEL_EXPORTER_*).

Emit a Run Summary after each major task:

steps taken, tools used, costs, artifacts produced.

10) Testing & Evals
Unit tests for services and helpers (/tests).

Tool stubs for offline tests (/packages/tools/__mocks__).

Evals in /evals: regression suites that assert structured outputs from agents.

Run in CI:

pnpm lint && pnpm typecheck && pnpm test && pnpm evals

Example eval case:

ts
Copy code
// evals/cases/router.intent.spec.ts
import { describe, it, expect } from "vitest";
import { route } from "../../packages/agents/router";

describe("router", () => {
  it("routes search queries to search specialist", async () => {
    const res = await route({ input: "Find public data sources for X" });
    expect(res.status).toBe("success");
    expect(res.data.targetSpecialist).toBe("search");
  });
});
11) CI/CD Guardrails
Required checks: lint, typecheck, unit tests, evals, bundle size (if web).

PR template must include:

 Linked plan doc in docs/plans/...

 Output contracts added/updated

 Tests added/updated

 Docs updated

 Risk/rollback notes

Releases: conventional commits + changelog.

12) Developer & Codex Workflow
12.1 Branching
main (protected)

feat/*, fix/*, chore/*

12.2 Scripts (define in root package.json)
pnpm lint

pnpm typecheck

pnpm test

pnpm dev (runs the local app)

pnpm evals

12.3 Codex Playbook
Plan: Create docs/plans/YYYY-MM-DD-<task>.md with:

Goal, context

File impact list

Tool usage (with approval notes)

Tests/evals to create

Rollback plan

Ask for confirmation (unless YOLO).

Implement the minimal viable slice.

Add tests/evals and run checks.

Open PR with the checklist.

YOLO Mode: If CODEX_MODE=yolo or --mode yolo, skip confirmation but still write the plan doc and PR with risks noted.

13) Reference Prompts
13.1 Router System Prompt (excerpt)
sql
Copy code
You are the Router. Route only; do not execute heavy tasks.
Classify user intent and return a structured plan:
- targetSpecialist: one of ["qa","ops","search","frontend","data"]
- rationale: brief
- steps: ordered list (max 5)
- tools: minimal set needed

Do not include chain-of-thought. Return only the JSON matching RouterPlan schema.
If destructive actions are implied, mark plan.needsApproval = true with a short reason.
13.2 Specialist Pattern (excerpt)
sql
Copy code
You are the <specialist>. Single responsibility:
- Use deterministic services first; tools second; LLM last.
- Respect Tool Guards and Approval flow.
- Return AgentResult schema only.
- If blocked, propose the smallest unblocking step.
14) Example Manifests
14.1 Agent Manifest
yaml
Copy code
# packages/agents/router/agent.yaml
name: router
description: Routes intents to specialists; never executes destructive actions
outputs: RouterPlan
tools:
  - name: classify_intent
  - name: none
policies:
  needsApproval: true  # router cannot approve, specialists must request approval
14.2 Tool Manifest
yaml
Copy code
# packages/tools/web_search/tool.yaml
name: web_search
description: Search the web with domain filters and rate limits
destructive: false
requiresApproval: false
limits:
  rpm: 15
  timeoutMs: 15000
schemas:
  input: WebSearchInput
  output: WebSearchResult
15) Cost, Latency, and Budgets
Per request budgets in packages/core/budget.ts:

maxCostUsd (default: 0.10)

maxLatencyMs (default: 20_000)

maxToolCalls (default: 6)

Specialists must respect budgets and degrade gracefully (smaller context, fewer results).

16) Data & Privacy
Classify data: PUBLIC, INTERNAL, SENSITIVE.

Never write SENSITIVE data to logs or evals.

For persistence, prefer per-user namespaces and explicit retention periods.

17) Error Handling
Retries with backoff on transient errors.

Always return actionable remediation in error results.

For tool failures, include the tool name, input summary (redacted), and last HTTP status if applicable.

18) Local Dev Tips
pnpm i && pnpm dev to run the local app.

Use .env.local (gitignored) for overrides.

Use scripts/scaffold.ts to generate agents/tools with boilerplate (if present).

19) PR Template (copy to .github/pull_request_template.md)
md
Copy code
## Summary
What changed and why?

## Linked Plan
- docs/plans/YYYY-MM-DD-<task>.md

## Checks
- [ ] Output contracts updated
- [ ] Tests added/updated
- [ ] Evals run and passing
- [ ] Docs updated
- [ ] Risk & Rollback described

## Screenshots / Traces
(attach if relevant)
20) Frequently Used Commands
Adjust to your toolchain; examples assume pnpm and a Codex CLI.

bash
Copy code
# Setup & quality
pnpm i
pnpm lint
pnpm typecheck
pnpm test
pnpm evals

# Dev servers
pnpm -C apps/api dev
pnpm -C apps/web dev

# Codex (examples; check your CLI help)
codex plan "Add web_search tool + router wiring"
codex run --mode propose
codex run --mode safe
codex run --mode yolo  # Use sparingly

# If your CLI supports env-driven mode
export CODEX_MODE=propose|safe|yolo
21) Definition of Done (Feature)
Output contract defined and validated with zod

Small, reviewed PR with passing checks

Tests & evals cover the happy path + one edge case

Logs/traces show cost and latency within budget

Docs updated (README, plan, or ADR)

22) Roadmap for First Week (suggested)
Scaffold core/llm.ts, core/guard.ts, config/, log.ts

Build web_search tool (non-destructive) + tests

Implement router with intent classification and schema’d plan

Add two specialists (search, qa) with minimal outputs + eval cases

Wire CI (lint, typecheck, tests, evals) + PR template

Add cost/latency budgets + run summary

Optional: simple /apps/api endpoint to exercise router

23) Glossary
Router: Classifies intent and orchestrates specialists; no heavy work.

Specialist: Focused agent with bounded tools and a strict contract.

Tool: External capability behind a guard (HTTP, FS, issues, search).

Eval: A repeatable check that the agent returns the right structure/behavior.

YOLO: No approvals, still guarded by rate limits and redaction.

If conventions need to change, open an ADR in docs/adr/ and update this file with rationale.
