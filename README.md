# MHP_GPC

> Agentic platform scaffold that combines a router-specialist architecture with shared tooling, typed contracts, and rigorous operational guardrails.

## Table of Contents
1. [Project Goals](#project-goals)
2. [Architecture Overview](#architecture-overview)
3. [Data Source Integrations](#data-source-integrations)
4. [Endpoint Query Recipes](#endpoint-query-recipes)
5. [Data Freshness Expectations](#data-freshness-expectations)
6. [Observability & Alerting Policies](#observability--alerting-policies)
7. [Local Setup](#local-setup)
8. [Testing](#testing)
9. [Deployment Workflow](#deployment-workflow)
10. [Related Documents](#related-documents)

## Project Goals
- Deliver a modular agent framework where a lightweight router coordinates focused specialists through typed output contracts.
- Provide deterministic business logic, tool adapters, and configuration management that are safe by default and easy to extend.
- Establish documentation-first workflows so that plans, ADRs, and onboarding artifacts stay synchronized with the codebase.
- Ensure operational readiness via clear testing guidance, deployment steps, and observability hooks from the outset.

## Architecture Overview
The repository is structured for agentic development with separation between runtime apps, reusable packages, and documentation artifacts.

```
.
├─ apps/              # Entry points (API adapters, web UIs, workers)
│  ├─ api/            # REST/RPC gateway in front of the router & specialists
│  └─ web/            # Optional browser UI for manual task triggering
├─ packages/
│  ├─ agents/         # Router + specialist agents with shared contracts
│  ├─ tools/          # Tool wrappers (HTTP, search, data stores, etc.)
│  ├─ services/       # Deterministic business logic invoked by agents
│  ├─ core/           # Client abstractions, tracing, retry, budgets
│  └─ config/         # Typed environment/config management
├─ tests/             # Unit & integration tests (Vitest/Jest)
├─ evals/             # Evaluation suites to regress agent behaviors
├─ docs/              # Plans, ADRs, onboarding guides, and references
└─ scripts/           # Scaffolding and operational scripts
```

Key architectural principles:
- **Router-only orchestration:** The router classifies intent, allocates budgets (cost, latency, tool calls), and dispatches work to specialists without executing heavy logic itself.
- **Specialist single responsibility:** Each specialist implements a narrow contract with explicit tool access, guarded retries, and structured success/error responses.
- **Guarded tool use:** All tools declare destructive capability, approval requirements, and rate limits. Calls pass through a shared guard enforcing safety policies.
- **Typed contracts:** Zod schemas enforce that every agent interaction returns a discriminated union with `success`, `needs_approval`, or `error` states.
- **State discipline:** Short-term state lives per request; long-term memory (if enabled) must opt-in via explicit writes with TTLs and data-classification tagging.

## Data Source Integrations
Current status:
- No external data sources are wired in yet. The scaffold anticipates connectors implemented under `packages/tools/` with accompanying schemas in `packages/agents/shared/`.
- Environment variables should be declared in `.env.example` before introducing new integrations to maintain typed config coverage.

Planned integration patterns (replace placeholders when the concrete sources are defined):

| Data Source | Purpose | Access Path | Authentication | Notes |
|-------------|---------|-------------|----------------|-------|
| `TBD_PRIMARY_DB` | Authoritative operational data store | Future `packages/tools/db` client | Service account via `.env.local` | Add migration scripts under `scripts/` when defined. |
| `TBD_VECTOR_STORE` | Long-term semantic memory | `packages/core/vector` | API key with scoped permissions | Ensure write operations remain opt-in per specialist. |
| `TBD_SEARCH_API` | External search augmentation | `packages/tools/web_search` | Managed key rotated quarterly | Non-destructive; respects rpm & latency guardrails. |

> ⚠️ **Action Needed:** Update the table above once the specification finalizes data sources and credentials.

## Endpoint Query Recipes
The API surface will live under `apps/api/`. Until the implementation lands, use these recipes as a contract draft derived from the system specification. Replace any `TBD` placeholders when endpoints are finalized.

### Task Routing
```bash
curl -X POST "$API_BASE/api/v1/tasks/route" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "demo-001",
    "input": {
      "intent": "search",
      "payload": {
        "query": "latest evaluation runs"
      }
    },
    "budgets": {
      "maxCostUsd": 0.1,
      "maxLatencyMs": 20000,
      "maxToolCalls": 6
    }
  }'
```
**Expected response:**
```json
{
  "status": "success",
  "data": {
    "route": [
      {
        "specialist": "search",
        "inputs": {
          "query": "latest evaluation runs"
        }
      }
    ]
  },
  "traceId": "<uuid>"
}
```

### Specialist Invocation
```bash
curl -X POST "$API_BASE/api/v1/specialists/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "vector memory ttl policy",
    "topK": 5,
    "filters": { "classification": "PUBLIC" }
  }'
```
**Notes:**
- Include `traceId` headers from the routing response to keep traces correlated (`x-trace-id: <trace>`).
- Responses follow the shared contract: success payloads bundle results and cost metrics; errors surface remediation guidance.

### Run Summary Retrieval
```bash
curl "$API_BASE/api/v1/runs/demo-001/summary?includeTools=true"
```
**Purpose:** Retrieve the final transcript, tool usage, and cost breakdown for observability dashboards.

> ℹ️ These recipes are scaffolds. Validate path names, payloads, and query parameters against the authoritative API specification before production use.

## Data Freshness Expectations
| Dataset / Signal | Update Cadence | Freshness SLO | Validation Step |
|------------------|----------------|---------------|-----------------|
| Task routing budgets | On configuration change | < 5 minutes | Compare against `packages/core/budget.ts` defaults before deployment. |
| Tool registry metadata | Manual updates | Same-day | Run `pnpm -C packages/tools lint` to confirm schema alignment. |
| Evaluation fixtures (`/evals`) | On new specialist behaviors | 24 hours | Execute `pnpm evals` and review diffs in stored snapshots. |
| Long-term memory embeddings | Batched | 12 hours | Schedule vector refresh job; ensure TTL policies enforced. |

Document deviations from these targets in the deployment checklist and open an incident if freshness > 2x SLO.

## Observability & Alerting Policies
- **Logging:** Use Pino (or equivalent) structured logs with task IDs, trace IDs, cost, and latency metrics. Redact SENSITIVE data according to data-classification policy.
- **Tracing:** Instrument router and specialist boundaries with OpenTelemetry spans. Propagate `traceId` returned by the API to all downstream tool calls.
- **Metrics:**
  - Latency histograms per specialist (`agent.specialist.latency_ms`).
  - Tool invocation counts with success/error tags (`tool.calls{status}`).
  - Budget utilization gauges (cost, latency, tool call percentages).
- **Alerting:**
  - Page on-call if success rate drops below 95% over a 15-minute window.
  - Trigger warning alerts when latency p95 exceeds 75% of configured budget or when tool quota utilization > 80%.
  - Freshness monitors on each dataset described above (cron-driven checks).
- **Dashboards:** Centralize run summaries, tool usage, and evaluation pass rates. Link to dashboard URLs once provisioned.

## Local Setup
1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Environment configuration**
   - Copy `.env.example` to `.env.local` and populate required keys (tool APIs, database URIs, etc.).
   - Respect data-classification guidelines when adding new secrets.
3. **Run development servers**
   ```bash
   pnpm -C apps/api dev
   pnpm -C apps/web dev    # optional UI
   ```
4. **Scaffolding utilities**
   ```bash
   pnpm ts-node scripts/scaffold.ts --help
   ```
   Use scaffolding scripts to generate new specialists or tools with correct boilerplate.

## Testing
Execute quality gates before opening a pull request:
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm evals
```
- Add or update tests in `tests/` for new behaviors and keep evaluation fixtures current.
- Include benchmark comparisons if modifying performance-critical code paths.

## Deployment Workflow
1. Create a feature branch (`codex/YYYY-MM-DD-HHMM-feature`) and author a plan in `docs/plans/`.
2. Implement changes with incremental commits (conventional format) and keep each PR focused (< 400 LOC when possible).
3. Run the full test suite (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm evals`) and capture results for the PR description.
4. Update documentation (README, ADRs, onboarding) alongside code changes.
5. Submit a PR using the template in `AGENTS.md`, linking the associated plan and documenting risk/rollback.
6. On approval, merge via fast-forward or squash per repo policy, then deploy:
   - **API:** Trigger CI/CD pipeline or run `pnpm -C apps/api deploy` once defined.
   - **Web:** Execute `pnpm -C apps/web build` followed by the hosting provider deployment command.
7. Monitor observability dashboards and alerts for at least one run post-deploy; roll back via git revert if regressions appear.

## Related Documents
- **Plan:** [`docs/plans/2025-10-17-readme-refresh.md`](docs/plans/2025-10-17-readme-refresh.md)
- **Architecture Decision Records:** _None published yet. Create entries under `docs/adr/` as decisions are made._
- **Onboarding Checklist:** _Not yet available. Add a checklist under `docs/onboarding/` when onboarding begins._

---
For questions or updates, open an issue referencing the relevant plan or ADR and tag the owning specialist team.
