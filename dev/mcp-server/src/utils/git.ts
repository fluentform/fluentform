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
