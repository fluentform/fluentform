# AI Review Workflow

## What this is

This folder contains a local orchestration starter for:

- OpenSpec-first feature work,
- dual-model code review,
- local quality gates, and
- pre-push enforcement.

## Commands

- `npm run ai:change -- add-my-feature`
- `npm run ai:review -- --change=add-my-feature`
- `npm run ai:dashboard`
- `npm run hooks:install`

## Model setup

`PLAN.json` controls the reviewer list.

- Local reviewer example: LM Studio or any OpenAI-compatible local server with a Qwen coder model.
- Hosted reviewer example: Gemini with `GEMINI_API_KEY`.

If a reviewer is not configured, the orchestrator warns and continues unless you
run with `--strict-models`.

### LM Studio

- Start the LM Studio local server on port `1234`
- Load the model `qwen2.5-coder-7b-instruct`
- The default plan points to `http://127.0.0.1:1234/v1`
- `LM_STUDIO_API_KEY` is optional for local LM Studio; any non-empty bearer token works

## OpenSpec vs OpenAPI

- Use `openspec/changes/<change-id>/` for every meaningful feature.
- Use `openapi.yaml` only when a change adds or modifies REST endpoints.
