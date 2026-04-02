import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { plugins, pluginAbsPath } from "../config.js";
import { run } from "../utils/run.js";

export function registerRegistryTools(server: McpServer): void {
  // registry_list — list all plugins in the ecosystem registry
  server.tool(
    "registry_list",
    "List all plugins in the FluentForm ecosystem registry with their paths, slugs, and branches.",
    {},
    async () => {
      const rows = plugins.map((p) => {
        const absPath = pluginAbsPath(p);
        const exists = existsSync(absPath);
        return {
          key: p.key,
          path: p.path,
          absPath,
          slug: p.slug ?? "(no wp.org slug)",
          branch: p.branch,
          present: exists,
        };
      });

      const lines = rows.map(
        (r) =>
          `${r.key.padEnd(20)} branch=${r.branch.padEnd(10)} slug=${r.slug.padEnd(36)} present=${r.present ? "yes" : "NO "} path=${r.absPath}`
      );

      return {
        content: [
          {
            type: "text",
            text: `FluentForm Ecosystem Registry (${rows.length} plugins)\n\n${lines.join("\n")}`,
          },
        ],
      };
    }
  );

  // registry_framework_versions — read wpfluent/framework version from each plugin's composer.json
  server.tool(
    "registry_framework_versions",
    "Show the wpfluent/framework version constraint declared in each plugin's composer.json.",
    {
      plugin: z
        .string()
        .optional()
        .describe("Filter to a single plugin key (e.g. 'fluentform'). Omit for all."),
    },
    async ({ plugin }) => {
      const targets = plugin
        ? plugins.filter((p) => p.key === plugin)
        : plugins;

      if (plugin && targets.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown plugin key: "${plugin}". Valid keys: ${plugins.map((p) => p.key).join(", ")}`,
            },
          ],
        };
      }

      const lines: string[] = [];

      for (const p of targets) {
        const composerPath = join(pluginAbsPath(p), "composer.json");
        if (!existsSync(composerPath)) {
          lines.push(`${p.key.padEnd(20)} (no composer.json)`);
          continue;
        }

        try {
          const json = JSON.parse(readFileSync(composerPath, "utf-8")) as {
            require?: Record<string, string>;
            name?: string;
          };
          const frameworkVersion =
            json.require?.["wpfluent/framework"] ?? "(not declared)";
          const pluginName = json.name ?? p.key;
          lines.push(`${p.key.padEnd(20)} ${frameworkVersion.padEnd(20)} (${pluginName})`);
        } catch {
          lines.push(`${p.key.padEnd(20)} (error reading composer.json)`);
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `wpfluent/framework versions\n\n${"PLUGIN".padEnd(20)} ${"CONSTRAINT".padEnd(20)} PACKAGE\n${"-".repeat(70)}\n${lines.join("\n")}`,
          },
        ],
      };
    }
  );

  // registry_branches — show the current git branch of each plugin directory
  server.tool(
    "registry_branches",
    "Show the current git branch checked out in each plugin directory.",
    {
      plugin: z
        .string()
        .optional()
        .describe("Filter to a single plugin key (e.g. 'fluentformpro'). Omit for all."),
    },
    async ({ plugin }) => {
      const targets = plugin
        ? plugins.filter((p) => p.key === plugin)
        : plugins;

      if (plugin && targets.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown plugin key: "${plugin}". Valid keys: ${plugins.map((p) => p.key).join(", ")}`,
            },
          ],
        };
      }

      const results = await Promise.all(
        targets.map(async (p) => {
          const absPath = pluginAbsPath(p);
          if (!existsSync(absPath)) {
            return { key: p.key, expected: p.branch, current: "(directory missing)", match: false };
          }
          if (!existsSync(join(absPath, ".git"))) {
            return { key: p.key, expected: p.branch, current: "(not a git repo)", match: false };
          }
          const res = await run("git", ["branch", "--show-current"], absPath);
          const current = res.ok ? res.stdout : "(error)";
          return {
            key: p.key,
            expected: p.branch,
            current,
            match: current === p.branch,
          };
        })
      );

      const lines = results.map((r) => {
        const status = r.match ? "OK " : "!  ";
        return `${status} ${r.key.padEnd(20)} current=${r.current.padEnd(20)} expected=${r.expected}`;
      });

      const mismatches = results.filter((r) => !r.match).length;
      const summary =
        mismatches === 0
          ? "All plugins are on their expected branch."
          : `${mismatches} plugin(s) are NOT on the expected branch.`;

      return {
        content: [
          {
            type: "text",
            text: `Git Branch Status\n\n${lines.join("\n")}\n\n${summary}`,
          },
        ],
      };
    }
  );
}
