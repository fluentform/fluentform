# AI Review Tasks

This file is the human-readable companion to `PLAN.json`.

## Current Workflow

- Start new feature work by creating an OpenSpec change folder.
- Update `openapi.yaml` only when the feature adds or changes REST endpoints.
- Run `npm run ai:review -- --change=<change-id>` during development.
- Let `.githooks/pre-push` run the same review and test gate before `git push`.

## Latest Findings

No recorded findings.
