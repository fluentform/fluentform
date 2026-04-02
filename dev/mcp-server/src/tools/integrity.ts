import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { plugins } from "../config.js";
import { grepInPlugin } from "../utils/grep.js";

// ──────────────────────────────────────────────────────────────────────────────
// integrity_orm_queries
// Scans PHP across all (or selected) plugins for ORM / raw-DB patterns
// and reports raw $wpdb usage, table-prefix access, and unsafe query patterns.
// ──────────────────────────────────────────────────────────────────────────────

const ormPatternsSchema = {
  plugins: z
    .array(z.string())
    .optional()
    .describe("Plugin keys to scan (omit for all)"),
  pattern: z
    .string()
    .optional()
    .describe(
      "Custom regex pattern to scan for (default: common ORM / raw DB patterns)"
    ),
};

async function ormQueriesHandler(args: {
  plugins?: string[];
  pattern?: string;
}) {
  const targets = args.plugins
    ? plugins.filter((p) => args.plugins!.includes(p.key))
    : plugins;

  const pat = args.pattern ?? "\\$wpdb->|wpFluent\\(\\)|->table\\(|->select\\(|->where\\(|->rawQuery\\(|prepare\\s*\\(";

  const results: Record<
    string,
    { file: string; line: number; text: string }[]
  > = {};

  await Promise.all(
    targets.map(async (plugin) => {
      const matches = await grepInPlugin(plugin, pat, "*.php");
      if (matches.length === 0) return;
      results[plugin.key] = matches.map((m) => ({
        file: m.file,
        line: m.line,
        text: m.text,
      }));
    })
  );

  const pluginKeys = Object.keys(results);

  if (pluginKeys.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "No ORM / raw-DB patterns found in the selected plugins.",
        },
      ],
    };
  }

  const lines: string[] = [];

  for (const key of pluginKeys) {
    const hits = results[key];
    lines.push(`## ${key} (${hits.length} match${hits.length === 1 ? "" : "es"})`);
    lines.push("");

    // Group by file for readability
    const byFile: Record<string, typeof hits> = {};
    for (const h of hits) {
      (byFile[h.file] = byFile[h.file] || []).push(h);
    }

    for (const [file, fileHits] of Object.entries(byFile)) {
      lines.push(`### ${file}`);
      for (const h of fileHits) {
        lines.push(`  L${h.line}: ${h.text}`);
      }
      lines.push("");
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: lines.join("\n"),
      },
    ],
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// integrity_communication
// Scans for cross-plugin hook/filter communication patterns:
// do_action / apply_filters / add_action / add_filter with fluentform/ prefix,
// plus any direct calls to wp_remote_post/get (inter-service HTTP).
// ──────────────────────────────────────────────────────────────────────────────

const communicationSchema = {
  plugins: z
    .array(z.string())
    .optional()
    .describe("Plugin keys to scan (omit for all)"),
  hookPrefix: z
    .string()
    .optional()
    .describe("Hook prefix to filter by (default: fluentform/)"),
  type: z
    .enum(["all", "action", "filter", "http"])
    .optional()
    .describe("Communication type to scan: all | action | filter | http (default: all)"),
};

async function communicationHandler(args: {
  plugins?: string[];
  hookPrefix?: string;
  type?: "all" | "action" | "filter" | "http";
}) {
  const prefix = args.hookPrefix ?? "fluentform/";
  const commType = args.type ?? "all";

  const patterns: { label: string; regex: string }[] = [];

  if (commType === "all" || commType === "action") {
    patterns.push({
      label: "do_action",
      regex: `do_action\\s*\\(\\s*['"]${prefix}`,
    });
    patterns.push({
      label: "add_action",
      regex: `add_action\\s*\\(\\s*['"]${prefix}`,
    });
  }

  if (commType === "all" || commType === "filter") {
    patterns.push({
      label: "apply_filters",
      regex: `apply_filters\\s*\\(\\s*['"]${prefix}`,
    });
    patterns.push({
      label: "add_filter",
      regex: `add_filter\\s*\\(\\s*['"]${prefix}`,
    });
  }

  if (commType === "all" || commType === "http") {
    patterns.push({
      label: "wp_remote",
      regex: `wp_remote_(post|get|request)\\s*\\(`,
    });
  }

  const targets = args.plugins
    ? plugins.filter((p) => args.plugins!.includes(p.key))
    : plugins;

  type HitEntry = { file: string; line: number; text: string; label: string };
  const byPlugin: Record<string, HitEntry[]> = {};

  await Promise.all(
    targets.map(async (plugin) => {
      const pluginHits: HitEntry[] = [];

      await Promise.all(
        patterns.map(async ({ label, regex }) => {
          const matches = await grepInPlugin(plugin, regex, "*.php");
          for (const m of matches) {
            pluginHits.push({ file: m.file, line: m.line, text: m.text, label });
          }
        })
      );

      if (pluginHits.length > 0) {
        pluginHits.sort((a, b) =>
          a.file.localeCompare(b.file) || a.line - b.line
        );
        byPlugin[plugin.key] = pluginHits;
      }
    })
  );

  const pluginKeys = Object.keys(byPlugin).sort();

  if (pluginKeys.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `No cross-plugin communication patterns found for prefix "${prefix}".`,
        },
      ],
    };
  }

  const lines: string[] = [];

  for (const key of pluginKeys) {
    const hits = byPlugin[key];
    lines.push(`## ${key} (${hits.length} match${hits.length === 1 ? "" : "es"})`);
    lines.push("");

    const byFile: Record<string, HitEntry[]> = {};
    for (const h of hits) {
      (byFile[h.file] = byFile[h.file] || []).push(h);
    }

    for (const [file, fileHits] of Object.entries(byFile)) {
      lines.push(`### ${file}`);
      for (const h of fileHits) {
        lines.push(`  [${h.label}] L${h.line}: ${h.text}`);
      }
      lines.push("");
    }
  }

  // Summary table
  const summary: string[] = ["## Summary", ""];
  summary.push("| Plugin | Total |");
  summary.push("|--------|-------|");
  for (const key of pluginKeys) {
    summary.push(`| ${key} | ${byPlugin[key].length} |`);
  }

  return {
    content: [
      {
        type: "text" as const,
        text: [...summary, "", ...lines].join("\n"),
      },
    ],
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Registration
// ──────────────────────────────────────────────────────────────────────────────

export function registerIntegrityTools(server: McpServer): void {
  server.tool(
    "integrity_orm_queries",
    "Scan PHP files across FluentForm ecosystem plugins for ORM and raw database query patterns. " +
      "Identifies $wpdb direct usage, wpFluent() calls, query builder chains, and unsafe prepare() patterns. " +
      "Useful for auditing database access consistency and spotting raw queries that bypass the ORM.",
    ormPatternsSchema,
    ormQueriesHandler
  );

  server.tool(
    "integrity_communication",
    "Scan PHP files across FluentForm ecosystem plugins for cross-plugin communication patterns. " +
      "Reports do_action / apply_filters / add_action / add_filter calls matching a hook prefix " +
      "(default: fluentform/) and any wp_remote_* HTTP calls. " +
      "Useful for auditing inter-plugin coupling and verifying hook naming conventions.",
    communicationSchema,
    communicationHandler
  );
}
