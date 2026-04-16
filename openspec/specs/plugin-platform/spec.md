# Plugin Platform Specification

## Purpose

Define how new features enter this plugin through OpenSpec proposals, task tracking,
and contract-first API changes.

## Requirements

### Requirement: New work starts with an OpenSpec change
Every user-facing feature or API addition MUST start with a folder under
`openspec/changes/<change-id>/`.

#### Scenario: Creating a new feature
- WHEN a contributor starts a new feature
- THEN they create `proposal.md`, `design.md`, `tasks.md`, and at least one spec delta
- AND the change identifier is passed to the AI review orchestrator

### Requirement: OpenAPI is optional and only applies to REST work
Changes that add or modify REST endpoints SHOULD describe those endpoints in
`openapi.yaml` before implementation.

#### Scenario: Adding a new REST controller
- WHEN a change introduces a new endpoint
- THEN `openapi.yaml` is updated first when the team wants contract-driven generation or validation
- AND generated or handwritten controllers follow the documented contract

### Requirement: Push-time AI review uses evidence
Push-time AI review MUST combine model findings with local test evidence before
blocking a push.

#### Scenario: Conflicting model reviews
- WHEN reviewer models disagree
- THEN the orchestrator requests a reconciliation round
- AND only findings supported by changed files, specs, or local test output can block the push
