# FluentForm Ecosystem MCP Server

This MCP server provides local tooling for the FluentForm plugin ecosystem. It runs as a stdio process and is intended to be launched by an MCP-compatible client.

## What It Does

The server can inspect the configured FluentForm ecosystem repositories and expose tools for:

- Plugin registry and branch status
- WPFluent framework version drift
- Hook discovery across plugins
- File and hook impact analysis
- Release readiness and changelog generation
- WordPress.org stats and review lookup
- Cross-plugin integrity scans for DB/query and communication patterns

Configured plugin paths live in [src/config.ts](./src/config.ts).

## Requirements

- Node.js 20+
- npm
- `git`
- `rg` recommended, but optional

The server expects the FluentForm ecosystem repos to exist under `PLUGINS_ROOT`.

Default:

```bash
/Volumes/Projects/forms/wp-content/plugins
```

## Install

From the Fluent Forms plugin root:

```bash
cd dev/mcp-server
npm install
npm run build
```

Build output will be generated in `dev/mcp-server/dist/`.

## Run

Start the stdio server manually:

```bash
cd /Volumes/Projects/forms/wp-content/plugins/fluentform/dev/mcp-server
PLUGINS_ROOT=/Volumes/Projects/forms/wp-content/plugins node dist/index.js
```

The process will wait for MCP JSON-RPC messages on stdin. That is expected.

## MCP Client Config

Example config:

```json
{
  "mcpServers": {
    "fluentform-ecosystem": {
      "command": "node",
      "args": [
        "/Volumes/Projects/forms/wp-content/plugins/fluentform/dev/mcp-server/dist/index.js"
      ],
      "env": {
        "PLUGINS_ROOT": "/Volumes/Projects/forms/wp-content/plugins"
      }
    }
  }
}
```

This repo already contains a project-local example in [../../.claude/mcp_servers.json](../../.claude/mcp_servers.json).

## Smoke Test

Initialize the MCP server directly from the terminal:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | PLUGINS_ROOT=/Volumes/Projects/forms/wp-content/plugins node dev/mcp-server/dist/index.js
```

Expected result:

- JSON response
- `serverInfo.name` should be `fluentform-ecosystem`

## Manual Protocol Test

You can also test the MCP protocol step by step.

Start the server:

```bash
cd /Volumes/Projects/forms/wp-content/plugins/fluentform/dev/mcp-server
PLUGINS_ROOT=/Volumes/Projects/forms/wp-content/plugins node dist/index.js
```

Then send these messages, one per line:

### 1. Initialize

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"manual-test","version":"1.0.0"}}}
```

### 2. Initialized Notification

```json
{"jsonrpc":"2.0","method":"notifications/initialized"}
```

### 3. List Tools

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

### 4. Call a Tool

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"registry_list","arguments":{}}}
```

## Available Tools

- `registry_list`
- `registry_framework_versions`
- `registry_branches`
- `hooks_find`
- `hooks_list`
- `impact_file`
- `impact_hook`
- `release_check`
- `release_changelog`
- `wporg_stats`
- `wporg_reviews`
- `integrity_orm_queries`
- `integrity_communication`

## Example Tool Calls

### Registry Overview

```json
{"name":"registry_list","arguments":{}}
```

### Branch Status

```json
{"name":"registry_branches","arguments":{}}
```

### Find a Hook Across Plugins

```json
{"name":"hooks_find","arguments":{"hook":"fluentform/submission_inserted"}}
```

### List Hooks Fired by a Plugin

```json
{"name":"hooks_list","arguments":{"plugin":"fluentform"}}
```

### File Impact Analysis

```json
{"name":"impact_file","arguments":{"plugin":"fluentform","file":"app/Services/Form/FormService.php"}}
```

### Hook Impact Analysis

```json
{"name":"impact_hook","arguments":{"hook":"fluentform/loaded"}}
```

### Release Readiness

```json
{"name":"release_check","arguments":{"plugin":"fluentform"}}
```

### Release Changelog

```json
{"name":"release_changelog","arguments":{"plugin":"fluentform","limit":20}}
```

### ORM / Raw Query Integrity Scan

```json
{"name":"integrity_orm_queries","arguments":{"plugins":["fluentform","fluentformpro"]}}
```

### Cross-Plugin Communication Scan

```json
{"name":"integrity_communication","arguments":{"plugins":["fluentform","fluentformpro"],"type":"all"}}
```

### WordPress.org Stats

```json
{"name":"wporg_stats","arguments":{"slug":"fluentform"}}
```

### WordPress.org Reviews

```json
{"name":"wporg_reviews","arguments":{"slug":"fluentform","count":5}}
```

## Notes

- `wporg_stats` and `wporg_reviews` require network access.
- Some registry and release tools will report `MISSING` if sibling repos under `PLUGINS_ROOT` are not present.
- The server uses `git` for branch and release checks.
- The server prefers `rg` for search and falls back to `grep`.
