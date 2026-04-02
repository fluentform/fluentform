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
