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
