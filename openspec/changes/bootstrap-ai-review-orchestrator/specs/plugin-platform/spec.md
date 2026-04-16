## ADDED Requirements

### Requirement: AI review can run against an OpenSpec change
The repository MUST support running the review orchestrator for a specific OpenSpec
change identifier.

#### Scenario: Review a feature before push
- WHEN a contributor runs `npm run ai:review -- --change=<change-id>`
- THEN the orchestrator loads that change's proposal, design, tasks, and spec deltas
- AND the review prompt uses those artifacts as context

### Requirement: Pre-push reviews respect local quality gates
The pre-push hook MUST run configured local quality gates before allowing a push.

#### Scenario: A configured gate fails
- WHEN a gate exits with a non-zero status
- THEN the push is blocked
- AND the failure is written to the latest review report
