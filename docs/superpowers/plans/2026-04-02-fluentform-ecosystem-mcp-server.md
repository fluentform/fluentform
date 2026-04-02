# FluentForm Ecosystem MCP Server — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MCP server that gives Claude Code cross-plugin visibility into the FluentForm ecosystem — hooks, ORM queries, release readiness, WordPress.org stats, and impact analysis across 8 repos.

**Architecture:** Single TypeScript MCP server at `dev/mcp-server/` using `@modelcontextprotocol/sdk`. Tools shell out to `git`/`rg` via `execFile` (safe, no shell) for filesystem work and use native `fetch` for WordPress.org API. 13 tools across 6 groups.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk` 1.29.0, `zod`, Node.js `child_process.execFile`

**Spec:** `docs/superpowers/specs/2026-04-02-fluentform-ecosystem-mcp-server-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `dev/mcp-server/package.json` | Dependencies and build scripts |
| `dev/mcp-server/tsconfig.json` | TypeScript config targeting ES2022/NodeNext |
| `dev/mcp-server/src/index.ts` | Server entry — creates McpServer, imports and registers all tools |
| `dev/mcp-server/src/config.ts` | Plugin registry: paths, slugs, branches. Resolves from `PLUGINS_ROOT` env |
| `dev/mcp-server/src/utils/run.ts` | Safe subprocess wrapper using `child_process.execFile` (no shell injection) |
| `dev/mcp-server/src/utils/git.ts` | Git helpers: log, status, branch, diff via `run.ts` |
| `dev/mcp-server/src/utils/grep.ts` | Cross-repo grep: tries `rg`, falls back to `grep -rn` |
| `dev/mcp-server/src/utils/schema.ts` | Parse migration PHP files to table/column map |
| `dev/mcp-server/src/utils/wporg-api.ts` | WordPress.org Plugin API client via `fetch` |
| `dev/mcp-server/src/tools/registry.ts` | 3 tools: `registry_list`, `registry_framework_versions`, `registry_branches` |
| `dev/mcp-server/src/tools/hooks.ts` | 2 tools: `hooks_find`, `hooks_list` |
| `dev/mcp-server/src/tools/impact.ts` | 2 tools: `impact_file`, `impact_hook` |
| `dev/mcp-server/src/tools/release.ts` | 2 tools: `release_check`, `release_changelog` |
| `dev/mcp-server/src/tools/wporg.ts` | 2 tools: `wporg_stats`, `wporg_reviews` |
| `dev/mcp-server/src/tools/integrity.ts` | 2 tools: `integrity_orm_queries`, `integrity_communication` |
| `.claude/mcp_servers.json` | Register the server for Claude Code |

---

### Task 1: Project Scaffolding

**Files:**
- Create: `dev/mcp-server/package.json`
- Create: `dev/mcp-server/tsconfig.json`
- Create: `dev/mcp-server/.gitignore`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "fluentform-ecosystem-mcp",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "watch": "tsc --watch"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.29.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Create .gitignore**

```
node_modules/
dist/
```

- [ ] **Step 4: Install dependencies**

Run: `cd dev/mcp-server && npm install`
Expected: `node_modules/` created, `package-lock.json` generated

- [ ] **Step 5: Commit**

```bash
git add dev/mcp-server/package.json dev/mcp-server/tsconfig.json dev/mcp-server/.gitignore dev/mcp-server/package-lock.json
git commit -m "Add: MCP server project scaffolding"
```

---

### Task 2: Config and Run Utility

**Files:**
- Create: `dev/mcp-server/src/config.ts`
- Create: `dev/mcp-server/src/utils/run.ts`

- [ ] **Step 1: Create config.ts**

```typescript
import { resolve } from "node:path";

export interface PluginConfig {
  key: string;
  path: string;
  slug: string | null;
  branch: string;
}

const PLUGINS_ROOT = process.env.PLUGINS_ROOT || "/Volumes/Projects/forms/wp-content/plugins";

export const plugins: PluginConfig[] = [
  { key: "fluentform",     path: "fluentform",                          slug: "fluentform",            branch: "dev" },
  { key: "fluentformpro",  path: "fluentformpro",                       slug: null,                    branch: "dev" },
  { key: "conversational", path: "fluent-conversational-js",             slug: null,                    branch: "dev" },
  { key: "signature",      path: "fluentform-signature",                 slug: "fluentform-signature",  branch: "release" },
  { key: "pdf",            path: "fluentforms-pdf",                      slug: "fluentforms-pdf",       branch: "master" },
  { key: "wpml",           path: "multilingual-forms-fluent-forms-wpml", slug: null,                    branch: "main" },
  { key: "mailpoet",       path: "fluent-forms-connector-for-mailpoet",  slug: null,                    branch: "master" },
  { key: "developer-docs", path: "fluentform-developer-docs",            slug: null,                    branch: "main" },
];

export const wporgSlugs = ["fluentform", "fluentforms-pdf", "fluentform-signature", "fluent-smtp"];

export function pluginAbsPath(plugin: PluginConfig): string {
  return resolve(PLUGINS_ROOT, plugin.path);
}

export function getPlugin(key: string): PluginConfig | undefined {
  return plugins.find((p) => p.key === key);
}
```

- [ ] **Step 2: Create run.ts — safe subprocess wrapper**

Uses `child_process.execFile` (array args, no shell) to prevent command injection.

```typescript
import { execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFileCb);

export interface RunResult {
  stdout: string;
  stderr: string;
  ok: boolean;
}

export async function run(
  cmd: string,
  args: string[],
  cwd?: string
): Promise<RunResult> {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30_000,
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), ok: true };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    return {
      stdout: (e.stdout || "").trim(),
      stderr: (e.stderr || "").trim(),
      ok: false,
    };
  }
}
```

- [ ] **Step 3: Verify build**

Run: `cd dev/mcp-server && npm run build`
Expected: `dist/config.js` and `dist/utils/run.js` created without errors

- [ ] **Step 4: Commit**

```bash
git add dev/mcp-server/src/config.ts dev/mcp-server/src/utils/run.ts
git commit -m "Add: Plugin config registry and safe subprocess runner"
```

---

### Task 3: Git and Grep Utilities

**Files:**
- Create: `dev/mcp-server/src/utils/git.ts`
- Create: `dev/mcp-server/src/utils/grep.ts`

- [ ] **Step 1: Create git.ts**

```typescript
import { run } from "./run.js";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface GitStatus {
  branch: string;
  dirty: boolean;
  aheadBehind: string;
  lastCommitDate: string;
  lastCommitMsg: string;
}

export async function gitStatus(repoPath: string): Promise<GitStatus | null> {
  if (!existsSync(join(repoPath, ".git"))) return null;

  const [branchRes, statusRes, logRes, abRes] = await Promise.all([
    run("git", ["branch", "--show-current"], repoPath),
    run("git", ["status", "--porcelain"], repoPath),
    run("git", ["log", "-1", "--format=%ai|%s"], repoPath),
    run("git", ["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], repoPath),
  ]);

  const [date, msg] = (logRes.stdout || "|").split("|", 2);

  let aheadBehind = "no upstream";
  if (abRes.ok && abRes.stdout) {
    const [ahead, behind] = abRes.stdout.split(/\s+/);
    aheadBehind = `ahead ${ahead}, behind ${behind}`;
  }

  return {
    branch: branchRes.stdout || "unknown",
    dirty: statusRes.stdout.length > 0,
    aheadBehind,
    lastCommitDate: date.trim(),
    lastCommitMsg: (msg || "").trim(),
  };
}

export async function gitLog(
  repoPath: string,
  since: string,
  format = "%h|%ai|%s"
): Promise<string[]> {
  const res = await run("git", ["log", `--since=${since}`, `--format=${format}`], repoPath);
  if (!res.ok || !res.stdout) return [];
  return res.stdout.split("\n");
}

export async function gitLogSinceRef(
  repoPath: string,
  ref: string,
  format = "%h|%ai|%s"
): Promise<string[]> {
  const res = await run("git", ["log", `${ref}..HEAD`, `--format=${format}`], repoPath);
  if (!res.ok || !res.stdout) return [];
  return res.stdout.split("\n");
}
```

- [ ] **Step 2: Create grep.ts**

```typescript
import { run } from "./run.js";
import { plugins, pluginAbsPath, type PluginConfig } from "../config.js";
import { existsSync } from "node:fs";

export interface GrepMatch {
  plugin: string;
  file: string;
  line: number;
  text: string;
}

async function detectRg(): Promise<boolean> {
  const res = await run("rg", ["--version"]);
  return res.ok;
}

let hasRg: boolean | null = null;

async function useRg(): Promise<boolean> {
  if (hasRg === null) hasRg = await detectRg();
  return hasRg;
}

export async function grepInPlugin(
  plugin: PluginConfig,
  pattern: string,
  glob?: string
): Promise<GrepMatch[]> {
  const dir = pluginAbsPath(plugin);
  if (!existsSync(dir)) return [];

  const rg = await useRg();

  let args: string[];
  if (rg) {
    args = ["-n", "--no-heading", pattern];
    if (glob) args.push("-g", glob);
    args.push(dir);
  } else {
    args = ["-rn", pattern, dir];
    if (glob) args.push("--include", glob);
  }

  const res = await run(rg ? "rg" : "grep", args);
  if (!res.stdout) return [];

  return res.stdout.split("\n").filter(Boolean).map((line) => {
    const match = line.match(/^(.+?):(\d+):(.*)$/);
    if (!match) return null;
    const filePath = match[1].replace(dir + "/", "");
    return {
      plugin: plugin.key,
      file: filePath,
      line: parseInt(match[2], 10),
      text: match[3].trim(),
    };
  }).filter((m): m is GrepMatch => m !== null);
}

export async function grepAllPlugins(
  pattern: string,
  glob?: string,
  pluginKeys?: string[]
): Promise<GrepMatch[]> {
  const targets = pluginKeys
    ? plugins.filter((p) => pluginKeys.includes(p.key))
    : plugins;

  const results = await Promise.all(
    targets.map((p) => grepInPlugin(p, pattern, glob))
  );
  return results.flat();
}
```

- [ ] **Step 3: Verify build**

Run: `cd dev/mcp-server && npm run build`
Expected: `dist/utils/git.js` and `dist/utils/grep.js` created without errors

- [ ] **Step 4: Commit**

```bash
git add dev/mcp-server/src/utils/git.ts dev/mcp-server/src/utils/grep.ts
git commit -m "Add: Git and grep utility modules"
```

---

### Task 4: Schema Parser and WordPress.org API Client

**Files:**
- Create: `dev/mcp-server/src/utils/schema.ts`
- Create: `dev/mcp-server/src/utils/wporg-api.ts`

- [ ] **Step 1: Create schema.ts**

Migration files use `CREATE TABLE` SQL with backtick-quoted column names (see `database/Migrations/Forms.php` and `Submissions.php` for the pattern). This parser extracts table names from `$wpdb->prefix . 'table_name'` and columns from backtick-quoted definitions.

```typescript
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { plugins, pluginAbsPath } from "../config.js";

export interface TableColumn {
  name: string;
  type: string;
}

export interface TableSchema {
  table: string;
  columns: TableColumn[];
  plugin: string;
  file: string;
}

export function buildSchemaMap(): TableSchema[] {
  const schemas: TableSchema[] = [];

  for (const plugin of plugins) {
    const migrationsDir = join(pluginAbsPath(plugin), "database", "Migrations");
    if (!existsSync(migrationsDir)) continue;

    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".php"));

    for (const file of files) {
      const content = readFileSync(join(migrationsDir, file), "utf-8");
      const parsed = parseCreateStatements(content, plugin.key, file);
      schemas.push(...parsed);
    }
  }

  return schemas;
}

function parseCreateStatements(
  php: string,
  pluginKey: string,
  file: string
): TableSchema[] {
  const results: TableSchema[] = [];

  // Match table name from: $wpdb->prefix . 'fluentform_forms'
  const tableMatches = php.matchAll(/\$wpdb->prefix\s*\.\s*['"](\w+)['"]/g);
  const tableNames = [...new Set([...tableMatches].map((m) => m[1]))];

  // Match CREATE TABLE blocks
  const createBlocks = php.matchAll(/CREATE TABLE \$table\s*\(([\s\S]*?)\)\s*\$/g);

  for (const block of createBlocks) {
    const body = block[1];
    const columns: TableColumn[] = [];

    // Match: `column_name` TYPE...
    const colMatches = body.matchAll(/`(\w+)`\s+([\w()]+)/g);
    for (const col of colMatches) {
      if (["PRIMARY", "KEY", "UNIQUE", "INDEX"].includes(col[1].toUpperCase())) continue;
      columns.push({ name: col[1], type: col[2] });
    }

    const tableName = tableNames[0] || "unknown";
    if (columns.length > 0) {
      results.push({ table: tableName, columns, plugin: pluginKey, file });
    }
  }

  return results;
}

export function findTable(schemas: TableSchema[], tableName: string): TableSchema | undefined {
  return schemas.find(
    (s) => s.table === tableName || s.table === tableName.replace("fluentform_", "")
  );
}

export function findColumn(
  schema: TableSchema,
  columnName: string
): TableColumn | undefined {
  return schema.columns.find((c) => c.name === columnName);
}
```

- [ ] **Step 2: Create wporg-api.ts**

```typescript
export interface WpOrgPluginInfo {
  name: string;
  slug: string;
  version: string;
  active_installs: number;
  rating: number;
  num_ratings: number;
  last_updated: string;
  tested: string;
  requires: string;
  requires_php: string;
  support_threads: number;
  support_threads_resolved: number;
}

export interface WpOrgReview {
  rating: number;
  date: string;
  reviewer: string;
  content: string;
}

const API_BASE = "https://api.wordpress.org/plugins/info/1.2/";

export async function fetchPluginInfo(slug: string): Promise<WpOrgPluginInfo | null> {
  try {
    const url = `${API_BASE}?action=plugin_information&request[slug]=${slug}&request[fields][active_installs]=1&request[fields][ratings]=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const data = await res.json() as Record<string, unknown>;
    if (data.error) return null;

    return {
      name: String(data.name || ""),
      slug: String(data.slug || ""),
      version: String(data.version || ""),
      active_installs: Number(data.active_installs || 0),
      rating: Number(data.rating || 0),
      num_ratings: Number(data.num_ratings || 0),
      last_updated: String(data.last_updated || ""),
      tested: String(data.tested || ""),
      requires: String(data.requires || ""),
      requires_php: String(data.requires_php || ""),
      support_threads: Number(data.support_threads || 0),
      support_threads_resolved: Number(data.support_threads_resolved || 0),
    };
  } catch {
    return null;
  }
}

export async function fetchReviews(
  slug: string,
  count = 10
): Promise<WpOrgReview[]> {
  try {
    const url = `https://wordpress.org/support/plugin/${slug}/reviews/feed/`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return [];
    const xml = await res.text();

    const reviews: WpOrgReview[] = [];
    const items = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);

    for (const item of items) {
      if (reviews.length >= count) break;
      const body = item[1];
      const title = body.match(/<title>(.*?)<\/title>/)?.[1] || "";
      const date = body.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";
      const creator = body.match(/<dc:creator>(.*?)<\/dc:creator>/)?.[1] || "";

      const stars = (title.match(/&#9733;/g) || []).length || parseInt(title.match(/\[(\d)/)?.[1] || "0", 10);

      reviews.push({
        rating: stars || 5,
        date: date ? new Date(date).toISOString().split("T")[0] : "",
        reviewer: creator.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1"),
        content: title.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1").slice(0, 200),
      });
    }

    return reviews;
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Verify build**

Run: `cd dev/mcp-server && npm run build`
Expected: `dist/utils/schema.js` and `dist/utils/wporg-api.js` created without errors

- [ ] **Step 4: Commit**

```bash
git add dev/mcp-server/src/utils/schema.ts dev/mcp-server/src/utils/wporg-api.ts
git commit -m "Add: Schema parser and WordPress.org API client"
```

---

### Task 5: Registry Tools

**Files:**
- Create: `dev/mcp-server/src/tools/registry.ts`

- [ ] **Step 1: Create registry.ts**

Implements 3 tools: `registry_list`, `registry_framework_versions`, `registry_branches`. All read-only, no inputs required.

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { plugins, pluginAbsPath } from "../config.js";
import { gitStatus } from "../utils/git.js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

function readPluginVersion(dir: string): string {
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".php"))) {
    const content = readFileSync(join(dir, f), "utf-8");
    if (content.includes("Plugin Name:")) {
      const match = content.match(/Version:\s*(.+)/i);
      if (match) return match[1].trim();
    }
  }
  return "unknown";
}

function readFrameworkVersion(dir: string): { required: string; installed: string } {
  let required = "none";
  let installed = "unknown";

  const composerJson = join(dir, "composer.json");
  if (existsSync(composerJson)) {
    const content = readFileSync(composerJson, "utf-8");
    const match = content.match(/"wpfluent\/framework"\s*:\s*"([^"]+)"/);
    if (match) required = match[1];
  }

  const composerLock = join(dir, "composer.lock");
  if (existsSync(composerLock)) {
    const content = readFileSync(composerLock, "utf-8");
    const lockMatch = content.match(/"name"\s*:\s*"wpfluent\/framework"[\s\S]*?"version"\s*:\s*"([^"]+)"/);
    if (lockMatch) installed = lockMatch[1];
  }

  return { required, installed };
}

export function registerRegistryTools(server: McpServer): void {
  server.registerTool(
    "registry_list",
    {
      description: "Overview of all FluentForm ecosystem plugins: version, framework version, branch, last commit, dirty status",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const rows: string[] = ["Plugin | Version | WPFluent | Branch | Last Commit | Dirty", "---|---|---|---|---|---"];

      for (const plugin of plugins) {
        const dir = pluginAbsPath(plugin);
        if (!existsSync(dir)) {
          rows.push(`${plugin.key} | MISSING | - | - | - | -`);
          continue;
        }

        const version = readPluginVersion(dir);
        const fw = readFrameworkVersion(dir);
        const git = await gitStatus(dir);

        rows.push([
          plugin.key,
          version,
          fw.installed === "unknown" && fw.required === "none" ? "-" : fw.installed,
          git?.branch || "no git",
          git?.lastCommitDate.split(" ")[0] || "-",
          git?.dirty ? "YES" : "clean",
        ].join(" | "));
      }

      return { content: [{ type: "text" as const, text: rows.join("\n") }] };
    }
  );

  server.registerTool(
    "registry_framework_versions",
    {
      description: "Check WPFluent framework version drift across all FluentForm plugins",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const rows: string[] = ["Plugin | Required | Installed | Drift?", "---|---|---|---"];
      const installedVersions: string[] = [];

      for (const plugin of plugins) {
        const dir = pluginAbsPath(plugin);
        if (!existsSync(dir)) continue;

        const fw = readFrameworkVersion(dir);
        if (fw.required === "none") continue;

        if (fw.installed !== "unknown") installedVersions.push(fw.installed);
        const drift = installedVersions.length > 1 && new Set(installedVersions).size > 1 ? "DRIFT" : "ok";

        rows.push(`${plugin.key} | ${fw.required} | ${fw.installed} | ${drift}`);
      }

      const uniqueVersions = [...new Set(installedVersions)];
      let summary = `\n\nInstalled versions: ${uniqueVersions.join(", ")}`;
      if (uniqueVersions.length > 1) {
        summary += `\nFramework version drift detected across ${uniqueVersions.length} versions`;
      } else {
        summary += "\nAll plugins on the same framework version.";
      }

      return { content: [{ type: "text" as const, text: rows.join("\n") + summary }] };
    }
  );

  server.registerTool(
    "registry_branches",
    {
      description: "Branch status across all FluentForm repos: current branch, ahead/behind, uncommitted changes",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const rows: string[] = ["Plugin | Branch | Expected | Ahead/Behind | Dirty", "---|---|---|---|---"];

      for (const plugin of plugins) {
        const dir = pluginAbsPath(plugin);
        if (!existsSync(dir)) {
          rows.push(`${plugin.key} | MISSING | ${plugin.branch} | - | -`);
          continue;
        }

        const git = await gitStatus(dir);
        if (!git) {
          rows.push(`${plugin.key} | no git | ${plugin.branch} | - | -`);
          continue;
        }

        const branchOk = git.branch === plugin.branch;
        rows.push(`${plugin.key} | ${git.branch} | ${branchOk ? "ok" : "expected: " + plugin.branch} | ${git.aheadBehind} | ${git.dirty ? "YES" : "clean"}`);
      }

      return { content: [{ type: "text" as const, text: rows.join("\n") }] };
    }
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd dev/mcp-server && npm run build`
Expected: `dist/tools/registry.js` created without errors

- [ ] **Step 3: Commit**

```bash
git add dev/mcp-server/src/tools/registry.ts
git commit -m "Add: Plugin registry tools (list, framework versions, branches)"
```

---

### Task 6: Hook Search Tools

**Files:**
- Create: `dev/mcp-server/src/tools/hooks.ts`

- [ ] **Step 1: Create hooks.ts**

Implements `hooks_find` and `hooks_list`. Handles both `fluentform/` (new) and `fluentform_` (deprecated) prefixes.

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { grepAllPlugins, type GrepMatch } from "../utils/grep.js";

interface HookResult {
  plugin: string;
  file: string;
  line: number;
  type: "fires" | "listens";
  hookFn: string;
}

function classifyHookMatch(match: GrepMatch): HookResult | null {
  const text = match.text;
  let hookFn = "";
  let type: "fires" | "listens" = "fires";

  if (text.includes("do_action")) { hookFn = "do_action"; type = "fires"; }
  else if (text.includes("apply_filters")) { hookFn = "apply_filters"; type = "fires"; }
  else if (text.includes("add_action")) { hookFn = "add_action"; type = "listens"; }
  else if (text.includes("add_filter")) { hookFn = "add_filter"; type = "listens"; }
  else return null;

  return { plugin: match.plugin, file: match.file, line: match.line, type, hookFn };
}

export function registerHookTools(server: McpServer): void {
  server.registerTool(
    "hooks_find",
    {
      description: "Find which FluentForm ecosystem plugins fire or listen to a specific hook",
      inputSchema: {
        hook: z.string().describe("Hook name, e.g. 'fluentform/submission_inserted'"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ hook }) => {
      const escaped = hook.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const altHook = hook.includes("/") ? hook.replace("/", "_") : null;
      const pattern = altHook
        ? `(${escaped}|${altHook.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`
        : escaped;

      const matches = await grepAllPlugins(pattern, "*.php");
      const results = matches.map(classifyHookMatch).filter((r): r is HookResult => r !== null);

      if (results.length === 0) {
        return { content: [{ type: "text" as const, text: `No usage of hook "${hook}" found across the ecosystem.` }] };
      }

      const fires = results.filter((r) => r.type === "fires");
      const listens = results.filter((r) => r.type === "listens");

      let output = `## Hook: ${hook}\n\n`;
      output += `**Fired by** (${fires.length}):\n`;
      for (const r of fires) output += `- ${r.plugin} -> ${r.file}:${r.line} (${r.hookFn})\n`;
      output += `\n**Listened by** (${listens.length}):\n`;
      for (const r of listens) output += `- ${r.plugin} -> ${r.file}:${r.line} (${r.hookFn})\n`;

      return { content: [{ type: "text" as const, text: output }] };
    }
  );

  server.registerTool(
    "hooks_list",
    {
      description: "List all hooks fired (do_action/apply_filters) by a FluentForm ecosystem plugin or all plugins",
      inputSchema: {
        plugin: z.string().optional().describe("Plugin key, e.g. 'fluentformpro'. Omit for all."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ plugin }) => {
      const pattern = "(do_action|apply_filters)\\s*\\(";
      const pluginKeys = plugin ? [plugin] : undefined;
      const matches = await grepAllPlugins(pattern, "*.php", pluginKeys);

      const hooks = new Map<string, { plugin: string; file: string; line: number; fn: string }[]>();

      for (const match of matches) {
        const hookMatch = match.text.match(/(do_action|apply_filters)\s*\(\s*['"]([^'"]+)['"]/);
        if (!hookMatch) continue;
        const fn = hookMatch[1];
        const hookName = hookMatch[2];
        if (!hooks.has(hookName)) hooks.set(hookName, []);
        hooks.get(hookName)!.push({ plugin: match.plugin, file: match.file, line: match.line, fn });
      }

      const sorted = [...hooks.entries()].sort((a, b) => a[0].localeCompare(b[0]));

      let output = `## Hooks fired${plugin ? ` by ${plugin}` : ""}: ${sorted.length} unique\n\n`;
      for (const [hookName, entries] of sorted) {
        output += `**${hookName}**\n`;
        for (const e of entries) output += `  - ${e.plugin} -> ${e.file}:${e.line} (${e.fn})\n`;
      }

      return { content: [{ type: "text" as const, text: output }] };
    }
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd dev/mcp-server && npm run build`
Expected: `dist/tools/hooks.js` created without errors

- [ ] **Step 3: Commit**

```bash
git add dev/mcp-server/src/tools/hooks.ts
git commit -m "Add: Hook search tools (find, list)"
```

---

### Task 7: Impact Analysis Tools

**Files:**
- Create: `dev/mcp-server/src/tools/impact.ts`

- [ ] **Step 1: Create impact.ts**

Implements `impact_file` (find cross-plugin references to classes/functions in a file) and `impact_hook` (parameter count analysis for hook listeners).

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { grepAllPlugins } from "../utils/grep.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { plugins, pluginAbsPath } from "../config.js";

function extractDefinitions(filePath: string): { classes: string[]; functions: string[] } {
  if (!existsSync(filePath)) return { classes: [], functions: [] };
  const content = readFileSync(filePath, "utf-8");
  const classes = [...content.matchAll(/(?:class|interface|trait)\s+(\w+)/g)].map((m) => m[1]);
  const functions = [...content.matchAll(/(?:public|protected|private|static)?\s*function\s+(\w+)/g)].map((m) => m[1]);
  return { classes, functions };
}

export function registerImpactTools(server: McpServer): void {
  server.registerTool(
    "impact_file",
    {
      description: "Which companion plugins reference classes or functions defined in a given file?",
      inputSchema: {
        file: z.string().describe("File path relative to plugin root, e.g. 'app/Services/Form/FormService.php'"),
        plugin: z.string().optional().describe("Plugin the file belongs to. Defaults to 'fluentform'."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ file, plugin }) => {
      const sourcePlugin = plugin || "fluentform";
      const cfg = plugins.find((p) => p.key === sourcePlugin);
      if (!cfg) return { content: [{ type: "text" as const, text: `Unknown plugin: ${sourcePlugin}` }], isError: true };

      const absPath = join(pluginAbsPath(cfg), file);
      const { classes, functions } = extractDefinitions(absPath);

      if (classes.length === 0 && functions.length === 0) {
        return { content: [{ type: "text" as const, text: `No class/function definitions found in ${file}` }] };
      }

      let output = `## Impact analysis: ${file}\n\nDefinitions: ${classes.length} classes, ${functions.length} functions\n\n`;
      const otherPlugins = plugins.filter((p) => p.key !== sourcePlugin).map((p) => p.key);

      for (const cls of classes) {
        const refs = await grepAllPlugins(cls, "*.php", otherPlugins);
        if (refs.length > 0) {
          output += `### Class ${cls} -- ${refs.length} external references\n`;
          for (const ref of refs) output += `- ${ref.plugin} -> ${ref.file}:${ref.line}\n`;
          output += "\n";
        }
      }

      const significantFns = functions.filter(
        (f) => !f.startsWith("__") && !f.startsWith("get") && !f.startsWith("set") && f.length > 4
      );
      for (const fn of significantFns.slice(0, 20)) {
        const refs = await grepAllPlugins(fn, "*.php", otherPlugins);
        if (refs.length > 0) {
          output += `### Function ${fn} -- ${refs.length} external references\n`;
          for (const ref of refs.slice(0, 10)) output += `- ${ref.plugin} -> ${ref.file}:${ref.line}\n`;
          if (refs.length > 10) output += `  ... and ${refs.length - 10} more\n`;
          output += "\n";
        }
      }

      if (output.split("\n").length <= 5) output += "No external references found in companion plugins.\n";

      return { content: [{ type: "text" as const, text: output }] };
    }
  );

  server.registerTool(
    "impact_hook",
    {
      description: "If a hook signature changes, which listeners would break? Shows parameter counts.",
      inputSchema: {
        hook: z.string().describe("Hook name, e.g. 'fluentform/submission_inserted'"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ hook }) => {
      const escaped = hook.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const altHook = hook.includes("/") ? hook.replace("/", "_").replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : null;
      const pattern = altHook ? `(${escaped}|${altHook})` : escaped;

      const fireMatches = await grepAllPlugins(`(do_action|apply_filters).*${pattern}`, "*.php");
      const listenMatches = await grepAllPlugins(`(add_action|add_filter).*${pattern}`, "*.php");

      let output = `## Hook signature: ${hook}\n\n**Fires with parameters:**\n`;
      for (const m of fireMatches) {
        const argsMatch = m.text.match(/(do_action|apply_filters)\s*\(\s*['"][^'"]+['"],?\s*(.*)/);
        const args = argsMatch?.[2] || "";
        const paramCount = args ? args.split(",").length : 0;
        output += `- ${m.plugin} -> ${m.file}:${m.line} -- ${paramCount} params\n`;
      }

      output += "\n**Listeners expect:**\n";
      for (const m of listenMatches) {
        const argsMatch = m.text.match(/(add_action|add_filter)\s*\(\s*['"][^'"]+['"]\s*,\s*[^,]+(?:,\s*(\d+)\s*(?:,\s*(\d+))?)?/);
        const acceptedArgs = argsMatch?.[3] || "1";
        output += `- ${m.plugin} -> ${m.file}:${m.line} -- accepts ${acceptedArgs} params\n`;
      }

      if (fireMatches.length === 0 && listenMatches.length === 0) output += "\nNo usage found.\n";

      return { content: [{ type: "text" as const, text: output }] };
    }
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd dev/mcp-server && npm run build`
Expected: `dist/tools/impact.js` created without errors

- [ ] **Step 3: Commit**

```bash
git add dev/mcp-server/src/tools/impact.ts
git commit -m "Add: Impact analysis tools (file, hook)"
```

---

### Task 8: Release Readiness Tools

**Files:**
- Create: `dev/mcp-server/src/tools/release.ts`

- [ ] **Step 1: Create release.ts**

Implements `release_check` (pre-release checklist) and `release_changelog` (auto-generate from git log). The checklist validates: version header vs constant, readme.txt stable tag, tested up to, README.md changelog sync, pro version alignment, uncommitted changes.

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { pluginAbsPath, getPlugin } from "../config.js";
import { gitLogSinceRef, gitStatus } from "../utils/git.js";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

function readFile(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf-8") : null;
}

interface CheckResult {
  check: string;
  pass: boolean;
  detail: string;
}

export function registerReleaseTools(server: McpServer): void {
  server.registerTool(
    "release_check",
    {
      description: "Pre-release checklist for a FluentForm plugin: version alignment, readme, changelog, build freshness, uncommitted changes",
      inputSchema: {
        plugin: z.string().optional().describe("Plugin key, defaults to 'fluentform'"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ plugin }) => {
      const key = plugin || "fluentform";
      const cfg = getPlugin(key);
      if (!cfg) return { content: [{ type: "text" as const, text: `Unknown plugin: ${key}` }], isError: true };

      const dir = pluginAbsPath(cfg);
      if (!existsSync(dir)) return { content: [{ type: "text" as const, text: `Directory not found: ${dir}` }], isError: true };

      const checks: CheckResult[] = [];

      // Find main plugin file and version
      let headerVersion = "unknown";
      let mainPhpContent = "";
      for (const f of readdirSync(dir).filter((f) => f.endsWith(".php"))) {
        const content = readFile(join(dir, f));
        if (content && content.includes("Plugin Name:")) {
          const match = content.match(/\*\s*Version:\s*(.+)/i);
          if (match) { headerVersion = match[1].trim(); mainPhpContent = content; break; }
        }
      }

      // 1. Version constant
      const constMatch = mainPhpContent.match(/define\s*\(\s*'[A-Z_]+VERSION'\s*,\s*'([^']+)'/);
      const constantVersion = constMatch?.[1] || "not found";
      checks.push({
        check: "Header version matches constant",
        pass: headerVersion === constantVersion,
        detail: `Header: ${headerVersion}, Constant: ${constantVersion}`,
      });

      // 2. readme.txt
      const readmeTxt = readFile(join(dir, "readme.txt"));
      if (readmeTxt) {
        const stableTag = readmeTxt.match(/Stable tag:\s*(.+)/i)?.[1]?.trim();
        checks.push({
          check: "readme.txt Stable tag matches version",
          pass: stableTag === headerVersion,
          detail: `Stable tag: ${stableTag || "not found"}, Header: ${headerVersion}`,
        });

        const testedUpTo = readmeTxt.match(/Tested up to:\s*(.+)/i)?.[1]?.trim();
        checks.push({
          check: "readme.txt Tested up to is recent",
          pass: !!testedUpTo && parseFloat(testedUpTo) >= 6.7,
          detail: `Tested up to: ${testedUpTo || "not found"}`,
        });
      } else {
        checks.push({ check: "readme.txt exists", pass: false, detail: "File not found" });
      }

      // 3. README.md changelog sync
      const readmeMd = readFile(join(dir, "README.md"));
      if (readmeTxt && readmeMd) {
        const txtFirst = readmeTxt.match(/== Changelog ==[\s\S]*?=\s*(\d+\.\d+\.\d+)/)?.[1];
        const mdFirst = readmeMd.match(/## Changelog[\s\S]*?(\d+\.\d+\.\d+)/)?.[1];
        checks.push({
          check: "README.md changelog matches readme.txt",
          pass: !!txtFirst && txtFirst === mdFirst,
          detail: `readme.txt latest: ${txtFirst || "none"}, README.md latest: ${mdFirst || "none"}`,
        });
      }

      // 4. Pro compatibility (fluentform only)
      if (key === "fluentform") {
        const minProMatch = mainPhpContent.match(/FLUENTFORM_MINIMUM_PRO_VERSION'\s*,\s*'([^']+)'/);
        const minPro = minProMatch?.[1];
        if (minPro) {
          const proCfg = getPlugin("fluentformpro");
          let proVersion = "unknown";
          if (proCfg) {
            const proDir = pluginAbsPath(proCfg);
            if (existsSync(proDir)) {
              const proPhp = readFile(join(proDir, "fluentformpro.php"));
              const proMatch = proPhp?.match(/Version:\s*(.+)/i);
              if (proMatch) proVersion = proMatch[1].trim();
            }
          }
          checks.push({
            check: "Min pro version aligns with actual pro version",
            pass: proVersion !== "unknown" && proVersion >= minPro,
            detail: `Min required: ${minPro}, Pro actual: ${proVersion}`,
          });
        }
      }

      // 5. Git status
      const git = await gitStatus(dir);
      if (git) {
        checks.push({
          check: "No uncommitted changes",
          pass: !git.dirty,
          detail: git.dirty ? "Working tree has uncommitted changes" : "Clean",
        });
        checks.push({
          check: "On base branch",
          pass: git.branch === cfg.branch,
          detail: `Current: ${git.branch}, Expected: ${cfg.branch}`,
        });
      }

      // Format
      let output = `## Release Checklist: ${key} (${headerVersion})\n\n`;
      let passCount = 0;
      for (const c of checks) {
        if (c.pass) passCount++;
        output += `${c.pass ? "PASS" : "FAIL"} -- ${c.check}\n  ${c.detail}\n\n`;
      }
      output += `**Result: ${passCount}/${checks.length} passed**`;
      if (passCount < checks.length) output += " -- Fix failing checks before release.";

      return { content: [{ type: "text" as const, text: output }] };
    }
  );

  server.registerTool(
    "release_changelog",
    {
      description: "Auto-generate changelog from git commits since a tag or ref, formatted for readme.txt and README.md",
      inputSchema: {
        plugin: z.string().optional().describe("Plugin key, defaults to 'fluentform'"),
        since: z.string().describe("Git ref to start from, e.g. 'v6.1.0' or a commit hash"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ plugin, since }) => {
      const key = plugin || "fluentform";
      const cfg = getPlugin(key);
      if (!cfg) return { content: [{ type: "text" as const, text: `Unknown plugin: ${key}` }], isError: true };

      const dir = pluginAbsPath(cfg);
      const commits = await gitLogSinceRef(dir, since, "%s");

      if (commits.length === 0) {
        return { content: [{ type: "text" as const, text: `No commits found since ${since}` }] };
      }

      const groups: Record<string, string[]> = { Added: [], Fixed: [], Improved: [], Refactored: [], Other: [] };

      for (const msg of commits) {
        if (/^Add:/i.test(msg)) groups.Added.push(msg.replace(/^Add:\s*/i, ""));
        else if (/^Fix:/i.test(msg)) groups.Fixed.push(msg.replace(/^Fix:\s*/i, ""));
        else if (/^Improve:/i.test(msg)) groups.Improved.push(msg.replace(/^Improve:\s*/i, ""));
        else if (/^Refactor:/i.test(msg)) groups.Refactored.push(msg.replace(/^Refactor:\s*/i, ""));
        else if (/^Chore:/i.test(msg)) { /* skip */ }
        else groups.Other.push(msg);
      }

      let output = `## Changelog since ${since} (${commits.length} commits)\n\n`;

      output += "### readme.txt format\n\n";
      for (const [group, items] of Object.entries(groups)) {
        if (items.length === 0) continue;
        output += `**${group}:**\n`;
        for (const item of items) output += `* ${item}\n`;
        output += "\n";
      }

      output += "### README.md format\n\n";
      for (const [group, items] of Object.entries(groups)) {
        if (items.length === 0) continue;
        output += `**${group}:**\n`;
        for (const item of items) output += `- ${item}\n`;
        output += "\n";
      }

      return { content: [{ type: "text" as const, text: output }] };
    }
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd dev/mcp-server && npm run build`
Expected: `dist/tools/release.js` created without errors

- [ ] **Step 3: Commit**

```bash
git add dev/mcp-server/src/tools/release.ts
git commit -m "Add: Release readiness tools (check, changelog)"
```

---

### Task 9: WordPress.org Stats Tools

**Files:**
- Create: `dev/mcp-server/src/tools/wporg.ts`

- [ ] **Step 1: Create wporg.ts**

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { wporgSlugs } from "../config.js";
import { fetchPluginInfo, fetchReviews } from "../utils/wporg-api.js";

export function registerWporgTools(server: McpServer): void {
  server.registerTool(
    "wporg_stats",
    {
      description: "Fetch WordPress.org plugin stats: installs, ratings, support threads, version info",
      inputSchema: {
        slug: z.string().optional().describe("Plugin slug, e.g. 'fluentform'. Omit for all tracked slugs."),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ slug }) => {
      const slugs = slug ? [slug] : wporgSlugs;
      const rows: string[] = [
        "Plugin | Installs | Rating | Reviews | Support Open/Resolved | Tested | Updated",
        "---|---|---|---|---|---|---",
      ];

      const results = await Promise.all(slugs.map(fetchPluginInfo));

      for (let i = 0; i < slugs.length; i++) {
        const info = results[i];
        if (!info) {
          rows.push(`${slugs[i]} | API error | - | - | - | - | -`);
          continue;
        }
        const open = info.support_threads - info.support_threads_resolved;
        rows.push([
          info.name,
          info.active_installs.toLocaleString() + "+",
          `${info.rating}/100`,
          String(info.num_ratings),
          `${open} / ${info.support_threads_resolved}`,
          info.tested,
          info.last_updated.split(" ")[0],
        ].join(" | "));
      }

      return { content: [{ type: "text" as const, text: rows.join("\n") }] };
    }
  );

  server.registerTool(
    "wporg_reviews",
    {
      description: "Fetch recent WordPress.org reviews for a plugin",
      inputSchema: {
        slug: z.string().describe("Plugin slug, e.g. 'fluentform'"),
        count: z.number().optional().describe("Number of reviews, defaults to 10"),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ slug, count }) => {
      const reviews = await fetchReviews(slug, count || 10);

      if (reviews.length === 0) {
        return { content: [{ type: "text" as const, text: `No reviews found for ${slug} (or feed unavailable).` }] };
      }

      let output = `## Recent reviews for ${slug}\n\n`;
      for (const r of reviews) {
        output += `**${r.rating}/5** -- ${r.date} by ${r.reviewer}\n${r.content}\n\n`;
      }

      return { content: [{ type: "text" as const, text: output }] };
    }
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd dev/mcp-server && npm run build`
Expected: `dist/tools/wporg.js` created without errors

- [ ] **Step 3: Commit**

```bash
git add dev/mcp-server/src/tools/wporg.ts
git commit -m "Add: WordPress.org stats tools (stats, reviews)"
```

---

### Task 10: Cross-Plugin Integrity Tools

**Files:**
- Create: `dev/mcp-server/src/tools/integrity.ts`

- [ ] **Step 1: Create integrity.ts**

Implements `integrity_orm_queries` (validate ORM queries against migration schema) and `integrity_communication` (orphaned listeners, broken imports, route collisions, version gates).

```typescript
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { plugins, pluginAbsPath, getPlugin } from "../config.js";
import { grepAllPlugins, grepInPlugin } from "../utils/grep.js";
import { buildSchemaMap } from "../utils/schema.js";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function registerIntegrityTools(server: McpServer): void {
  server.registerTool(
    "integrity_orm_queries",
    {
      description: "Validate ORM queries reference real database tables and columns, cross-referencing against migration-defined schema",
      inputSchema: {
        plugin: z.string().optional().describe("Plugin key to scan, or omit for all"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ plugin }) => {
      const schemas = buildSchemaMap();

      if (schemas.length === 0) {
        return { content: [{ type: "text" as const, text: "No migration files found." }] };
      }

      const pluginKeys = plugin ? [plugin] : plugins.map((p) => p.key);
      const knownTables = schemas.map((s) => s.table);

      let output = `## ORM Query Validation\n\nSchema: ${schemas.length} tables: ${knownTables.join(", ")}\n\n`;
      const issues: string[] = [];

      // Find ->table('xxx') calls
      const tableQueries = await grepAllPlugins("->table\\s*\\(\\s*['\"]", "*.php", pluginKeys);

      for (const match of tableQueries) {
        const tableMatch = match.text.match(/->table\s*\(\s*['"](\w+)['"]/);
        if (!tableMatch) continue;
        const tableName = tableMatch[1];
        const exists = knownTables.some(
          (t) => t === tableName || `fluentform_${tableName}` === t || tableName === `fluentform_${t}`
        );
        if (!exists) {
          issues.push(`UNKNOWN TABLE: ${tableName} in ${match.plugin} -> ${match.file}:${match.line}`);
        }
      }

      // Find raw SQL without prepare (skip migrations)
      const rawSql = await grepAllPlugins("\\$wpdb->query\\s*\\((?!.*prepare)", "*.php", pluginKeys);
      for (const match of rawSql) {
        if (match.file.includes("Migrations/")) continue;
        issues.push(`RAW SQL (no prepare): ${match.plugin} -> ${match.file}:${match.line}`);
      }

      // Companion plugins directly accessing free plugin tables
      const companionKeys = pluginKeys.filter((k) => k !== "fluentform");
      if (companionKeys.length > 0) {
        const directAccess = await grepAllPlugins(
          "fluentform_(forms|submissions|form_meta|submission_meta|entry_details|logs|form_analytics|scheduled_actions)",
          "*.php",
          companionKeys
        );
        for (const match of directAccess) {
          if (match.text.includes("->table(") || match.text.includes("$wpdb")) {
            issues.push(`DIRECT TABLE ACCESS: ${match.plugin} -> ${match.file}:${match.line}`);
          }
        }
      }

      if (issues.length === 0) {
        output += "No issues found.\n";
      } else {
        output += `**${issues.length} issues:**\n\n`;
        for (const issue of issues) output += `- ${issue}\n`;
      }

      return { content: [{ type: "text" as const, text: output }] };
    }
  );

  server.registerTool(
    "integrity_communication",
    {
      description: "Verify cross-plugin integration health: orphaned listeners, broken imports, route collisions, version gates",
      annotations: { readOnlyHint: true },
    },
    async () => {
      let output = "## Cross-Plugin Integrity Check\n\n";
      const issues: { category: string; detail: string }[] = [];

      const freePlugin = getPlugin("fluentform")!;
      const companionPlugins = plugins.filter((p) => p.key !== "fluentform" && p.key !== "developer-docs");

      // 1. Orphaned listeners
      const freeHooks = await grepInPlugin(freePlugin, "(do_action|apply_filters)\\s*\\(\\s*['\"]fluentform/", "*.php");
      const freeHookNames = new Set(
        freeHooks.map((m) => {
          const match = m.text.match(/(do_action|apply_filters)\s*\(\s*['"]([^'"]+)['"]/);
          return match?.[2];
        }).filter(Boolean) as string[]
      );

      for (const companion of companionPlugins) {
        const listeners = await grepInPlugin(companion, "(add_action|add_filter)\\s*\\(\\s*['\"]fluentform/", "*.php");
        for (const listener of listeners) {
          const hookMatch = listener.text.match(/(add_action|add_filter)\s*\(\s*['"]([^'"]+)['"]/);
          if (!hookMatch) continue;
          const hookName = hookMatch[2];
          if (!freeHookNames.has(hookName)) {
            const underscore = hookName.replace("fluentform/", "fluentform_");
            if (!freeHookNames.has(underscore)) {
              issues.push({
                category: "Orphaned listener",
                detail: `${companion.key} listens to "${hookName}" but free doesn't fire it -- ${listener.file}:${listener.line}`,
              });
            }
          }
        }
      }

      // 2. Broken imports
      for (const companion of companionPlugins) {
        const imports = await grepInPlugin(companion, "use\\s+FluentForm\\\\App\\\\", "*.php");
        for (const imp of imports) {
          const classMatch = imp.text.match(/use\s+(FluentForm\\App\\[^\s;]+)/);
          if (!classMatch) continue;
          const fqcn = classMatch[1];
          const relPath = fqcn.replace("FluentForm\\App\\", "app/").replace(/\\/g, "/") + ".php";
          const absPath = join(pluginAbsPath(freePlugin), relPath);
          if (!existsSync(absPath)) {
            issues.push({
              category: "Broken import",
              detail: `${companion.key} imports "${fqcn}" but not found at ${relPath} -- ${imp.file}:${imp.line}`,
            });
          }
        }
      }

      // 3. Route collisions (free vs pro)
      const proPlugin = getPlugin("fluentformpro");
      if (proPlugin) {
        const freeRoutesFile = join(pluginAbsPath(freePlugin), "app/Http/Routes/api.php");
        const proRoutesFile = join(pluginAbsPath(proPlugin), "app/Http/Routes/api.php");

        if (existsSync(freeRoutesFile) && existsSync(proRoutesFile)) {
          const extractRoutes = (content: string): string[] => {
            const matches = content.matchAll(/\$router->(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/g);
            return [...matches].map((m) => `${m[1].toUpperCase()} ${m[2]}`);
          };
          const freeRoutes = extractRoutes(readFileSync(freeRoutesFile, "utf-8"));
          const proRoutes = extractRoutes(readFileSync(proRoutesFile, "utf-8"));

          for (const route of proRoutes) {
            if (freeRoutes.includes(route)) {
              issues.push({ category: "Route collision", detail: `Pro route "${route}" collides with free plugin` });
            }
          }
        }
      }

      // 4. Version gate mismatches
      for (const companion of companionPlugins) {
        const checks = await grepInPlugin(companion, "FLUENTFORM_VERSION", "*.php");
        for (const check of checks) {
          if (check.text.includes("version_compare") || check.text.includes(">=")) {
            const verMatch = check.text.match(/['"](\d+\.\d+\.\d+)['"]/);
            if (verMatch) {
              const required = verMatch[1];
              const mainPhp = readFileSync(join(pluginAbsPath(freePlugin), "fluentform.php"), "utf-8");
              const actual = mainPhp.match(/FLUENTFORM_VERSION'\s*,\s*'([^']+)'/)?.[1] || "unknown";
              if (actual !== "unknown" && required > actual) {
                issues.push({
                  category: "Version gate mismatch",
                  detail: `${companion.key} requires >= ${required} but free is ${actual} -- ${check.file}:${check.line}`,
                });
              }
            }
          }
        }
      }

      // Format
      if (issues.length === 0) {
        output += "All checks passed. No cross-plugin issues found.\n";
      } else {
        const byCategory = new Map<string, string[]>();
        for (const issue of issues) {
          if (!byCategory.has(issue.category)) byCategory.set(issue.category, []);
          byCategory.get(issue.category)!.push(issue.detail);
        }
        for (const [cat, details] of byCategory) {
          output += `### ${cat} (${details.length})\n`;
          for (const d of details) output += `- ${d}\n`;
          output += "\n";
        }
        output += `**Total: ${issues.length} issues across ${byCategory.size} categories**`;
      }

      return { content: [{ type: "text" as const, text: output }] };
    }
  );
}
```

- [ ] **Step 2: Verify build**

Run: `cd dev/mcp-server && npm run build`
Expected: `dist/tools/integrity.js` created without errors

- [ ] **Step 3: Commit**

```bash
git add dev/mcp-server/src/tools/integrity.ts
git commit -m "Add: Cross-plugin integrity tools (ORM queries, communication)"
```

---

### Task 11: Server Entry Point

**Files:**
- Create: `dev/mcp-server/src/index.ts`

- [ ] **Step 1: Create index.ts**

```typescript
#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerRegistryTools } from "./tools/registry.js";
import { registerHookTools } from "./tools/hooks.js";
import { registerImpactTools } from "./tools/impact.js";
import { registerReleaseTools } from "./tools/release.js";
import { registerWporgTools } from "./tools/wporg.js";
import { registerIntegrityTools } from "./tools/integrity.js";

const server = new McpServer(
  { name: "fluentform-ecosystem", version: "1.0.0" },
  {
    capabilities: { tools: {} },
    instructions: "FluentForm ecosystem tools: plugin registry, hook search, impact analysis, release readiness, WordPress.org stats, and cross-plugin integrity checks.",
  }
);

registerRegistryTools(server);
registerHookTools(server);
registerImpactTools(server);
registerReleaseTools(server);
registerWporgTools(server);
registerIntegrityTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
```

- [ ] **Step 2: Full build**

Run: `cd dev/mcp-server && npm run build`
Expected: All 12 files compiled to `dist/` without errors

- [ ] **Step 3: Smoke test -- verify server starts**

Run: `echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dev/mcp-server/dist/index.js 2>/dev/null | head -1`

Expected: A JSON response containing `"serverInfo"` with `"name":"fluentform-ecosystem"` (not an error/crash)

- [ ] **Step 4: Commit**

```bash
git add dev/mcp-server/src/index.ts
git commit -m "Add: MCP server entry point wiring all 13 tools"
```

---

### Task 12: Register MCP Server and Final Verification

**Files:**
- Modify: `.claude/mcp_servers.json`
- Modify: `.gitignore` (if needed)

- [ ] **Step 1: Update .claude/mcp_servers.json**

Add `fluentform-ecosystem` alongside the existing playwright entry:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--extension"],
      "env": {
        "PLAYWRIGHT_MCP_EXTENSION_TOKEN": "oo3LE95d1B6RZrIP4DVYzXyf4zbHgZEFs65mDNlW8Lw"
      }
    },
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

- [ ] **Step 2: Ensure build artifacts are gitignored**

Check the project `.gitignore` includes `dev/mcp-server/dist/` and `dev/mcp-server/node_modules/`. If not, add them.

- [ ] **Step 3: Final clean build**

Run: `cd dev/mcp-server && rm -rf dist && npm run build`
Expected: Fresh build with all files in `dist/`

- [ ] **Step 4: Commit**

```bash
git add .claude/mcp_servers.json .gitignore
git commit -m "Add: Register FluentForm ecosystem MCP server"
```

- [ ] **Step 5: Manual verification (after Claude Code restart)**

Restart Claude Code, then test these commands:
1. "Use registry_list" -- should show all 8 plugins with versions and branches
2. "Use hooks_find for fluentform/submission_inserted" -- should show fires/listens across repos
3. "Use wporg_stats" -- should show install counts and ratings for all 4 slugs
4. "Use integrity_communication" -- should check orphaned listeners, broken imports, route collisions
