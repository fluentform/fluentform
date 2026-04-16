# Proposal: Bootstrap AI Review Orchestrator

## Why

The plugin needs a repeatable way to:

- start new feature work from a spec instead of a diff,
- compare multiple model reviews instead of trusting a single answer,
- run local checks before `git push`, and
- keep human-readable task state in the repository.

## What Changes

- add an OpenSpec-first workflow,
- seed `openapi.yaml` as an optional contract file for REST endpoints,
- add a local orchestrator that can compare Ollama and Gemini style reviewers,
- add a pre-push hook that runs tests and evidence-based review, and
- record findings in build artifacts and `TASKS.md`.

## Success Criteria

- contributors can bootstrap a new feature change from the repo,
- `npm run ai:review` works without extra dependencies,
- `git push` is blocked when configured quality gates fail, and
- dual-model review can reconcile conflicting findings into a single report.
