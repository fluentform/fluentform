# Claude Code Skills

Skill files provide deep codebase knowledge to Claude Code. They are auto-loaded based on the `.claude/settings.json` configuration.

## Available Skills

| File | When to read |
|------|-------------|
| `architecture.md` | Understanding project structure, models, routes, stores, modules |
| `coding-patterns.md` | Writing new code — controller, handler, Vue component, API patterns |
| `workflow-bugfix.md` | Fixing bugs or security vulnerabilities |
| `workflow-forms.md` | Working on form builder, fields, rendering, submissions, entries |
| `workflow-integrations.md` | Working on notifications, integrations, webhooks, conditional logic |
| `workflow-payments.md` | Working on payment processing, Stripe, transactions, subscriptions |
| `workflow-conversational.md` | Working on conversational form mode, design editor, share pages |
| `workflow-pr.md` | Committing code, pushing branches, creating pull requests |
| `workflow-release.md` | Preparing releases — version bumps, build, changelog, pre-release checks |

## Documentation Hierarchy

1. **CLAUDE.md** — Build commands, architecture overview, coding rules (~45 lines)
2. **`.claude/skills/`** — Deep knowledge per topic (loaded on demand)
3. **Pro addon** — `../fluentformpro/` has its own CLAUDE.md and skills
