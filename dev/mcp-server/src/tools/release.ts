import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { plugins, pluginAbsPath, getPlugin } from "../config.js";
import { run } from "../utils/run.js";

// Read the declared version from the plugin's main PHP file (header comment or define).
function readPluginVersion(pluginPath: string, pluginKey: string): string | null {
  // Map plugin keys to their main PHP file names.
  const mainFileMap: Record<string, string> = {
    fluentform: "fluentform.php",
    fluentformpro: "fluentformpro.php",
    conversational: "fluent-conversational.php",
    signature: "fluentform-signature.php",
    pdf: "fluentforms-pdf.php",
    wpml: "multilingual-forms-fluent-forms-wpml.php",
    mailpoet: "fluent-forms-connector-for-mailpoet.php",
    "developer-docs": "",
  };

  const fileName = mainFileMap[pluginKey];
  if (!fileName || fileName === "") return null;

  const filePath = join(pluginPath, fileName);
  if (!existsSync(filePath)) return null;

  try {
    const content = readFileSync(filePath, "utf-8");
    // Try plugin header "Version: x.y.z"
    const headerMatch = content.match(/^\s*\*\s*Version:\s*(.+)$/m);
    if (headerMatch) return headerMatch[1].trim();
    // Try define('PLUGIN_VERSION', 'x.y.z')
    const defineMatch = content.match(/define\(\s*['"][A-Z_]+VERSION['"]\s*,\s*['"]([^'"]+)['"]/);
    if (defineMatch) return defineMatch[1].trim();
  } catch {
    // ignore read errors
  }

  return null;
}

// Get the most recent git tag in a repo.
async function getLatestTag(repoPath: string): Promise<string | null> {
  const res = await run(
    "git",
    ["describe", "--tags", "--abbrev=0"],
    repoPath
  );
  if (res.ok && res.stdout) return res.stdout;
  return null;
}

// Get commits since a ref (tag or branch). Returns formatted lines.
async function getCommitsSince(
  repoPath: string,
  ref: string
): Promise<string[]> {
  const res = await run(
    "git",
    ["log", `${ref}..HEAD`, "--format=%h %ai %s"],
    repoPath
  );
  if (!res.ok || !res.stdout) return [];
  return res.stdout.split("\n").filter(Boolean);
}

// Get all commits on HEAD if no tag exists.
async function getAllCommits(repoPath: string, limit = 50): Promise<string[]> {
  const res = await run(
    "git",
    ["log", `--max-count=${limit}`, "--format=%h %ai %s"],
    repoPath
  );
  if (!res.ok || !res.stdout) return [];
  return res.stdout.split("\n").filter(Boolean);
}

export function registerReleaseTools(server: McpServer): void {
  // release_check — readiness summary for one or all plugins
  server.tool(
    "release_check",
    "Check release readiness for one or all FluentForm ecosystem plugins. Reports version, git branch, dirty status, ahead/behind upstream, and latest tag.",
    {
      plugin: z
        .string()
        .optional()
        .describe(
          "Plugin key to check (e.g. 'fluentform', 'fluentformpro'). Omit to check all plugins."
        ),
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

      const rows = await Promise.all(
        targets.map(async (p) => {
          const absPath = pluginAbsPath(p);

          if (!existsSync(absPath)) {
            return { key: p.key, status: "MISSING", details: "directory not found" };
          }

          const hasGit = existsSync(join(absPath, ".git"));
          if (!hasGit) {
            return { key: p.key, status: "NO_GIT", details: "not a git repository" };
          }

          const [branchRes, statusRes, abRes, logRes] = await Promise.all([
            run("git", ["branch", "--show-current"], absPath),
            run("git", ["status", "--porcelain"], absPath),
            run("git", ["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], absPath),
            run("git", ["log", "-1", "--format=%ai %s"], absPath),
          ]);

          const branch = branchRes.ok ? branchRes.stdout : "unknown";
          const dirty = statusRes.ok && statusRes.stdout.length > 0;
          const lastCommit = logRes.ok ? logRes.stdout : "";

          let aheadBehind = "no upstream";
          if (abRes.ok && abRes.stdout) {
            const parts = abRes.stdout.split(/\s+/);
            aheadBehind = `ahead ${parts[0] ?? 0}, behind ${parts[1] ?? 0}`;
          }

          const latestTag = await getLatestTag(absPath);
          const version = readPluginVersion(absPath, p.key);

          const issues: string[] = [];
          if (dirty) issues.push("uncommitted changes");
          if (branch !== p.branch) issues.push(`wrong branch (expected ${p.branch})`);
          if (abRes.ok && abRes.stdout) {
            const behind = parseInt(abRes.stdout.split(/\s+/)[1] ?? "0", 10);
            if (behind > 0) issues.push(`${behind} commit(s) behind upstream`);
          }

          const readyStatus = issues.length === 0 ? "READY" : "NOT READY";

          return {
            key: p.key,
            status: readyStatus,
            version: version ?? "(unknown)",
            branch,
            expectedBranch: p.branch,
            dirty,
            aheadBehind,
            latestTag: latestTag ?? "(none)",
            lastCommit,
            issues,
          };
        })
      );

      const lines: string[] = [];
      for (const row of rows) {
        if (row.status === "MISSING" || row.status === "NO_GIT") {
          lines.push(`[${row.status}] ${row.key}: ${row.details}`);
          continue;
        }
        const r = row as {
          key: string;
          status: string;
          version: string;
          branch: string;
          expectedBranch: string;
          dirty: boolean;
          aheadBehind: string;
          latestTag: string;
          lastCommit: string;
          issues: string[];
        };
        const issueStr = r.issues.length > 0 ? `  Issues: ${r.issues.join("; ")}` : "";
        lines.push(
          [
            `[${r.status}] ${r.key}`,
            `  version=${r.version}  tag=${r.latestTag}`,
            `  branch=${r.branch} (expected=${r.expectedBranch})  dirty=${r.dirty}  ${r.aheadBehind}`,
            `  last commit: ${r.lastCommit}`,
            issueStr,
          ]
            .filter(Boolean)
            .join("\n")
        );
      }

      const readyCount = rows.filter((r) => r.status === "READY").length;
      const summary = `${readyCount}/${rows.length} plugin(s) are release-ready.`;

      return {
        content: [
          {
            type: "text",
            text: `Release Readiness Check\n${"=".repeat(50)}\n\n${lines.join("\n\n")}\n\n${summary}`,
          },
        ],
      };
    }
  );

  // release_changelog — commits since last tag for one or all plugins
  server.tool(
    "release_changelog",
    "Generate a changelog of git commits since the last tag for one or all FluentForm ecosystem plugins. Useful for drafting release notes.",
    {
      plugin: z
        .string()
        .optional()
        .describe(
          "Plugin key to generate changelog for (e.g. 'fluentform'). Omit to generate for all plugins."
        ),
      since: z
        .string()
        .optional()
        .describe(
          "Git ref (tag, branch, or commit SHA) to use as the starting point instead of the latest tag. E.g. '6.1.21' or 'v6.0.0'."
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(200)
        .optional()
        .default(50)
        .describe(
          "Maximum number of commits to show when no previous tag exists (default 50)."
        ),
    },
    async ({ plugin, since, limit }) => {
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

      const sections: string[] = [];

      for (const p of targets) {
        const absPath = pluginAbsPath(p);

        if (!existsSync(absPath)) {
          sections.push(`## ${p.key}\n(directory not found)`);
          continue;
        }

        if (!existsSync(join(absPath, ".git"))) {
          sections.push(`## ${p.key}\n(not a git repository)`);
          continue;
        }

        let ref = since ?? null;
        let refLabel: string;

        if (!ref) {
          ref = await getLatestTag(absPath);
          refLabel = ref ? `since tag ${ref}` : `last ${limit} commits (no tag found)`;
        } else {
          refLabel = `since ${ref}`;
        }

        const commits = ref
          ? await getCommitsSince(absPath, ref)
          : await getAllCommits(absPath, limit);

        const version = readPluginVersion(absPath, p.key);
        const header = `## ${p.key}${version ? ` (v${version})` : ""} — ${refLabel}`;

        if (commits.length === 0) {
          sections.push(`${header}\n(no commits)`);
          continue;
        }

        const commitLines = commits.map((c) => `- ${c}`).join("\n");
        sections.push(`${header}\n${commitLines}`);
      }

      return {
        content: [
          {
            type: "text",
            text: `FluentForm Ecosystem Changelog\n${"=".repeat(50)}\n\n${sections.join("\n\n")}`,
          },
        ],
      };
    }
  );
}
