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
