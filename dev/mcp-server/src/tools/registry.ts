import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { plugins, pluginAbsPath } from "../config.js";
import { gitStatus } from "../utils/git.js";

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
      description: "Overview of all FluentForm ecosystem plugins: version, WPFluent framework version, current branch, last commit date, dirty/clean status",
      annotations: { readOnlyHint: true },
    },
    async () => {
      const rows: string[] = [
        "Plugin | Version | WPFluent | Branch | Last Commit | Dirty",
        "---|---|---|---|---|---",
      ];

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
      description: "Check WPFluent framework version drift across all FluentForm plugins. Shows required vs installed versions and flags drift.",
      inputSchema: {
        plugin: z.string().optional().describe("Filter to a single plugin key. Omit for all."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ plugin }) => {
      const targets = plugin ? plugins.filter((p) => p.key === plugin) : plugins;
      const rows: string[] = ["Plugin | Required | Installed | Drift?", "---|---|---|---"];
      const installedVersions: string[] = [];

      for (const p of targets) {
        const dir = pluginAbsPath(p);
        if (!existsSync(dir)) continue;

        const fw = readFrameworkVersion(dir);
        if (fw.required === "none") continue;

        if (fw.installed !== "unknown") installedVersions.push(fw.installed);
        const drift = installedVersions.length > 1 && new Set(installedVersions).size > 1 ? "DRIFT" : "ok";

        rows.push(`${p.key} | ${fw.required} | ${fw.installed} | ${drift}`);
      }

      const unique = [...new Set(installedVersions)];
      let summary = `\n\nInstalled versions: ${unique.join(", ")}`;
      if (unique.length > 1) {
        summary += `\nFramework version drift detected across ${unique.length} versions`;
      } else if (unique.length === 1) {
        summary += "\nAll plugins on the same framework version.";
      }

      return { content: [{ type: "text" as const, text: rows.join("\n") + summary }] };
    }
  );

  server.registerTool(
    "registry_branches",
    {
      description: "Branch status across all FluentForm repos: current vs expected branch, ahead/behind upstream, uncommitted changes",
      inputSchema: {
        plugin: z.string().optional().describe("Filter to a single plugin key. Omit for all."),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ plugin }) => {
      const targets = plugin ? plugins.filter((p) => p.key === plugin) : plugins;
      const rows: string[] = ["Plugin | Branch | Expected | Ahead/Behind | Dirty", "---|---|---|---|---"];

      for (const p of targets) {
        const dir = pluginAbsPath(p);
        if (!existsSync(dir)) {
          rows.push(`${p.key} | MISSING | ${p.branch} | - | -`);
          continue;
        }

        const git = await gitStatus(dir);
        if (!git) {
          rows.push(`${p.key} | no git | ${p.branch} | - | -`);
          continue;
        }

        const branchOk = git.branch === p.branch;
        rows.push([
          p.key,
          git.branch,
          branchOk ? "ok" : `expected: ${p.branch}`,
          git.aheadBehind,
          git.dirty ? "YES" : "clean",
        ].join(" | "));
      }

      return { content: [{ type: "text" as const, text: rows.join("\n") }] };
    }
  );
}
