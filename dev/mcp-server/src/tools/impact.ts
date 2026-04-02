import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { plugins, pluginAbsPath, getPlugin } from "../config.js";
import { grepAllPlugins, grepInPlugin } from "../utils/grep.js";
import { existsSync } from "node:fs";

export function registerImpactTools(server: McpServer): void {
  server.registerTool(
    "impact_file",
    {
      description:
        "Analyse the cross-plugin impact of changing a file. Reports which other files across the ecosystem import or reference it and which hooks it fires or listens to.",
      inputSchema: {
        file: z
          .string()
          .describe(
            "Relative path within a plugin, e.g. 'app/Services/SubmissionHandlerService.php', or an absolute path."
          ),
        plugin: z
          .string()
          .optional()
          .describe(
            "Plugin key the file belongs to (e.g. 'fluentform'). Required when a relative path is supplied."
          ),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ file, plugin }) => {
      // Resolve absolute path and a search-friendly basename
      let absPath = file;
      let basename = file.replace(/^.*[\\/]/, "");

      if (plugin) {
        const cfg = getPlugin(plugin);
        if (!cfg) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Unknown plugin key: "${plugin}". Valid keys: ${plugins.map((p) => p.key).join(", ")}`,
              },
            ],
          };
        }
        absPath = `${pluginAbsPath(cfg)}/${file.replace(/^\//, "")}`;
      }

      if (!existsSync(absPath)) {
        return {
          content: [
            {
              type: "text" as const,
              text: `File not found: ${absPath}`,
            },
          ],
        };
      }

      // Search for references to this file across all plugins
      const escapedBasename = basename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const refPattern = escapedBasename.replace(/\.\w+$/, ""); // strip extension for broader match
      const [refMatches, hookMatches] = await Promise.all([
        grepAllPlugins(refPattern, "*.php"),
        plugin ? grepInPlugin(getPlugin(plugin)!, "(do_action|apply_filters|add_action|add_filter)\\s*\\(", "*.php") : Promise.resolve([]),
      ]);

      // Filter reference matches — skip the file itself
      const refs = refMatches.filter((m) => !m.file.endsWith(file.replace(/^\//, "")) && !absPath.endsWith(m.file));

      // Categorise hooks from the target file's own plugin
      const hooksFromFile: string[] = [];
      if (plugin) {
        const cfg = getPlugin(plugin)!;
        const fileRelative = file.replace(/^\//, "");
        for (const m of hookMatches) {
          if (m.file === fileRelative || absPath.endsWith(m.file)) {
            const hookMatch = m.text.match(/(do_action|apply_filters|add_action|add_filter)\s*\(\s*['"]([^'"]+)['"]/);
            if (hookMatch) {
              hooksFromFile.push(`${m.file}:${m.line} (${hookMatch[1]}) -> ${hookMatch[2]}`);
            }
          }
        }
      }

      let output = `## Impact Analysis: ${basename}\n\n`;

      output += `### References across ecosystem (${refs.length})\n`;
      if (refs.length === 0) {
        output += "No cross-plugin references found.\n";
      } else {
        for (const r of refs) {
          output += `- **${r.plugin}** -> ${r.file}:${r.line}\n  \`${r.text}\`\n`;
        }
      }

      output += `\n### Hooks in this file (${hooksFromFile.length})\n`;
      if (hooksFromFile.length === 0) {
        output += plugin
          ? "No hook calls found in this file.\n"
          : "Pass a `plugin` key to include hook analysis.\n";
      } else {
        for (const h of hooksFromFile) {
          output += `- ${h}\n`;
        }
      }

      const impactLevel =
        refs.length === 0 ? "LOW" : refs.length <= 3 ? "MEDIUM" : "HIGH";
      output += `\n### Impact level: ${impactLevel}\n`;
      output += `${refs.length} file(s) reference this across the ecosystem. `;
      output += hooksFromFile.length > 0
        ? `This file also fires/listens to ${hooksFromFile.length} hook(s) which may have additional consumers.`
        : "";

      return { content: [{ type: "text" as const, text: output }] };
    }
  );

  server.registerTool(
    "impact_hook",
    {
      description:
        "Analyse the cross-plugin impact of changing or removing a WordPress hook. Shows every plugin that fires it and every plugin that listens to it.",
      inputSchema: {
        hook: z
          .string()
          .describe("Hook name to analyse, e.g. 'fluentform/submission_inserted'"),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ hook }) => {
      const escaped = hook.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      // Also match underscore variant (fluentform_submission_inserted)
      const altHook = hook.includes("/") ? hook.replace("/", "_") : null;
      const pattern = altHook
        ? `(${escaped}|${altHook.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`
        : escaped;

      const matches = await grepAllPlugins(pattern, "*.php");

      if (matches.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: `No usage of hook "${hook}" found across the ecosystem.`,
            },
          ],
        };
      }

      interface HookEntry {
        plugin: string;
        file: string;
        line: number;
        fn: string;
      }

      const fires: HookEntry[] = [];
      const listens: HookEntry[] = [];

      for (const m of matches) {
        const hookMatch = m.text.match(/(do_action|apply_filters|add_action|add_filter)\s*\(\s*['"]([^'"]+)['"]/);
        if (!hookMatch) continue;
        const fn = hookMatch[1];
        const entry: HookEntry = { plugin: m.plugin, file: m.file, line: m.line, fn };
        if (fn === "do_action" || fn === "apply_filters") {
          fires.push(entry);
        } else {
          listens.push(entry);
        }
      }

      // Collect unique plugins affected
      const affectedPlugins = new Set([
        ...fires.map((e) => e.plugin),
        ...listens.map((e) => e.plugin),
      ]);

      let output = `## Hook Impact Analysis: ${hook}\n\n`;

      output += `### Fired by (${fires.length} occurrence(s))\n`;
      if (fires.length === 0) {
        output += "Not fired anywhere — may be fired dynamically or only in pro/add-ons.\n";
      } else {
        for (const e of fires) {
          output += `- **${e.plugin}** -> ${e.file}:${e.line} (${e.fn})\n`;
        }
      }

      output += `\n### Listened by (${listens.length} occurrence(s))\n`;
      if (listens.length === 0) {
        output += "No listeners found across the ecosystem.\n";
      } else {
        for (const e of listens) {
          output += `- **${e.plugin}** -> ${e.file}:${e.line} (${e.fn})\n`;
        }
      }

      output += `\n### Affected plugins (${affectedPlugins.size}): ${[...affectedPlugins].join(", ")}\n`;

      const impactLevel =
        affectedPlugins.size <= 1
          ? "LOW"
          : affectedPlugins.size <= 2
          ? "MEDIUM"
          : "HIGH";
      output += `\n### Impact level: ${impactLevel}\n`;
      output += `Changing or removing this hook affects ${affectedPlugins.size} plugin(s). `;
      if (listens.length > 0) {
        output += `Removing it will break ${listens.length} listener(s).`;
      }
      if (fires.length === 0) {
        output += " Warning: no fire site found — renaming may be safe but verify dynamic dispatch.";
      }

      return { content: [{ type: "text" as const, text: output }] };
    }
  );
}
