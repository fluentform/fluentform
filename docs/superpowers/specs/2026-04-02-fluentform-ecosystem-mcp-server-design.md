# FluentForm Ecosystem MCP Server — Design Spec

## Purpose

A single MCP server that gives Claude Code deep visibility into the FluentForm plugin ecosystem: cross-plugin hook usage, ORM query validation, release readiness, WordPress.org stats, and impact analysis across 8 interconnected repos.

## Scope

FluentForm free plugin + 7 companions. Not the broader Fluent ecosystem (CRM, Community, Cart, etc.).

### Tracked Plugins

| Key | Path | WordPress.org Slug | Base Branch |
|-----|------|--------------------|-------------|
| `fluentform` | `fluentform` | `fluentform` | `dev` |
| `fluentformpro` | `fluentformpro` | — | `dev` |
| `conversational` | `fluent-conversational-js` | — | `dev` |
| `signature` | `fluentform-signature` | `fluentform-signature` | `release` |
| `pdf` | `fluentforms-pdf` | `fluentforms-pdf` | `master` |
| `wpml` | `multilingual-forms-fluent-forms-wpml` | — | `main` |
| `mailpoet` | `fluent-forms-connector-for-mailpoet` | — | `master` |
| `developer-docs` | `fluentform-developer-docs` | — | `main` |

### WordPress.org Stats Slugs

`fluentform`, `fluentforms-pdf`, `fluentform-signature`, `fluent-smtp`

## Architecture

Single TypeScript MCP server at `dev/mcp-server/` inside the FluentForm repo. Registered in `.claude/mcp_servers.json`.

### Project Structure

```
dev/mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # MCP server entry, registers all tools
│   ├── config.ts             # Plugin registry (paths, slugs, branches)
│   ├── tools/
│   │   ├── registry.ts       # Plugin registry tools (3)
│   │   ├── hooks.ts          # Cross-plugin hook search (2)
│   │   ├── impact.ts         # Cross-plugin impact analysis (2)
│   │   ├── release.ts        # Release readiness checker (2)
│   │   ├── wporg.ts          # WordPress.org stats (2)
│   │   └── integrity.ts      # Cross-plugin integrity checks (2)
│   └── utils/
│       ├── git.ts            # Git helpers (log, diff, branch, status)
│       ├── grep.ts           # Cross-repo grep (rg with grep fallback)
│       ├── schema.ts         # Parse migrations → table/column map
│       └── wporg-api.ts      # WordPress.org API client
└── dist/                     # Compiled output (gitignored)
```

### Dependencies

- `@modelcontextprotocol/sdk` — MCP protocol
- `typescript` — build only

No other dependencies. Uses `execFile` (not `exec`) for `git`/`rg` subprocess calls and native `fetch` for WordPress.org API.

### MCP Registration

```json
{
  "mcpServers": {
    "fluentform-ecosystem": {
      "command": "node",
      "args": ["dev/mcp-server/dist/index.js"],
      "env": {
        "PLUGINS_ROOT": "/Volumes/Projects/forms/wp-content/plugins"
      }
    }
  }
}
```

## Tools (13 total)

### Group A: Plugin Registry (3 tools)

**`registry_list`**
- Overview of all plugins: name, version, wpfluent framework version, current branch, last commit date, dirty/clean status
- Reads plugin header from main `.php` file, parses `composer.lock` for wpfluent version, runs `git status` and `git log -1`

**`registry_framework_versions`**
- WPFluent framework drift check
- Table of required vs installed version per plugin
- Warns when versions diverge across repos

**`registry_branches`**
- Current branch, commits ahead/behind base, uncommitted changes per repo

### Group B: Hook Search (2 tools)

**`hooks_find`**
- Input: `{ hook: "fluentform/submission_inserted" }`
- Greps all repos for `do_action`, `add_action`, `apply_filters`, `add_filter` matching the hook
- Handles both `fluentform/` (new) and `fluentform_` (deprecated) prefixes
- Returns: plugin, file, line, type (`fires` | `listens`)

**`hooks_list`**
- Input: `{ plugin: "fluentformpro" }` (optional, defaults to all)
- Lists all `do_action` and `apply_filters` calls, grouped by plugin
- Returns: hook name, file, line

### Group C: Impact Analysis (2 tools)

**`impact_file`**
- Input: `{ file: "app/Services/Form/FormService.php" }`
- Finds classes/functions defined in the file, greps all repos for references
- Returns: which companion plugins import, extend, or call that code

**`impact_hook`**
- Input: `{ hook: "fluentform/submission_inserted" }`
- Finds all listeners with their expected parameter count
- Returns: potential mismatches if hook signature changes

### Group D: Release Readiness (2 tools)

**`release_check`**
- Input: `{ plugin: "fluentform" }` (optional, defaults to free)
- Checks:
  - Version in plugin header matches version constant (`FLUENTFORM_VERSION`)
  - `readme.txt` "Stable tag" matches version
  - `readme.txt` "Tested up to" is current WP version
  - `README.md` changelog section matches `readme.txt` changelog
  - `FLUENTFORM_MINIMUM_PRO_VERSION` aligns with pro's actual version
  - Build artifacts are fresh (manifest timestamps vs source timestamps)
  - No uncommitted changes on base branch
- Returns: pass/fail per check with fix suggestions

**`release_changelog`**
- Input: `{ plugin: "fluentform", since: "v6.1.0" }`
- Parses `git log` since the given ref, groups by commit prefix (`Fix:`, `Add:`, `Improve:`)
- Returns: formatted changelog ready for `readme.txt` and `README.md`

### Group E: WordPress.org Stats (2 tools)

**`wporg_stats`**
- Input: `{ slug: "fluentform" }` (optional, defaults to all 4 tracked slugs)
- Calls WordPress.org Plugin API
- Returns: active installs, rating, num ratings, last updated, tested up to, requires PHP, support threads (resolved/unresolved)

**`wporg_reviews`**
- Input: `{ slug: "fluentform", count: 10 }`
- Fetches recent reviews
- Returns: rating, date, excerpt, reviewer — sorted by date

### Group F: Cross-Plugin Integrity (2 tools)

**`integrity_orm_queries`**
- Input: `{ plugin: "fluentformpro" }` (optional, defaults to all)
- Builds schema map from migration files across all repos
- Scans for `wpFluent()` query builder calls and Eloquent model usage
- Flags: non-existent tables, misspelled columns, raw SQL bypassing query builder, companion plugins querying tables without using free plugin's models

**`integrity_communication`**
- Checks cross-plugin integration health:
  - **Orphaned listeners** — companion listens for a hook free no longer fires
  - **Broken imports** — companion uses `FluentForm\App\...` class that doesn't exist
  - **Route collisions** — pro routes that collide with free routes (same method + path)
  - **Version gate mismatches** — pro checks `FLUENTFORM_VERSION >= X` but X doesn't match what pro actually needs
  - **Filter return type mismatches** — basic static analysis: if free passes an array to a filter, companion shouldn't return a string
- Returns: pass/fail grouped by plugin pair (e.g., "free <> pro", "free <> PDF")

## Data Flow

### Shared utilities

- **`config.ts`** — plugin registry, resolved paths from `PLUGINS_ROOT` env var
- **`git.ts`** — wraps `git log`, `git status`, `git diff`, `git branch` via `execFile` (safe subprocess, no shell injection)
- **`grep.ts`** — wraps `rg` (ripgrep) with automatic fallback to `grep -rn`. Searches across all repos or a specific one
- **`schema.ts`** — parses `database/Migrations/*.php` files to build a map of tables and columns. Built fresh per call, not cached
- **`wporg-api.ts`** — `fetch()` calls to `api.wordpress.org`. Rate limited to 1 req/sec

### Tool dependencies

```
registry.ts  ← git.ts
hooks.ts     ← grep.ts
impact.ts    ← grep.ts + hooks.ts
release.ts   ← git.ts + schema.ts
wporg.ts     ← wporg-api.ts
integrity.ts ← schema.ts + grep.ts + hooks.ts
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Companion repo missing from disk | Skip, include `"missing": true` in results |
| Git not installed | Fail server startup with clear error |
| `rg` not available | Fall back to `grep -rn` |
| WordPress.org API down/timeout | Return partial results with `"wporg_error"` per slug |
| No `composer.lock` in plugin | Report framework version as `"unknown"` |
| Unparseable migration PHP | Skip file, log warning in result |
| No `.git` directory | Skip git-dependent fields |

Principle: never crash, always return partial results with clear indicators.

## Testing

No automated test suite. Manual verification during development:

1. `npm run build`
2. Register in `.claude/mcp_servers.json`
3. Restart Claude Code
4. Test each tool conversationally
5. Spot-check results against reality

## Build & Run

```bash
cd dev/mcp-server
npm install
npm run build    # tsc → dist/
# Server starts automatically via mcp_servers.json when Claude Code launches
```
