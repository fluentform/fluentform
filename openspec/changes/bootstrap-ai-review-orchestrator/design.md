# Design: Bootstrap AI Review Orchestrator

## Architecture

The workflow has three durable sources of truth:

- `openspec/` describes the change intent and expected behavior,
- `openapi.yaml` describes REST contracts when a feature actually has an API surface,
- `PLAN.json` configures models and quality gates.

The runtime flow is:

1. Select an OpenSpec change.
2. Collect changed files and git diff context.
3. Run local quality gates.
4. Ask two reviewers for independent findings.
5. Run a reconciliation round where each reviewer sees the peer result.
6. Merge only findings that survive evidence checks.
7. Write machine and human-readable reports.
8. Block `git push` when gates or blocker findings fail.

## Model Strategy

- Reviewer A: local Ollama model such as Qwen.
- Reviewer B: Gemini or another low-cost hosted model if configured.
- Evidence beats model confidence.
- Missing model credentials should warn, not silently pass.

## Rollout

- Phase 1: local orchestrator plus pre-push hook.
- Phase 2: richer PHP and Vue test suites.
- Phase 3: contract-driven code generation from `openapi.yaml`.
