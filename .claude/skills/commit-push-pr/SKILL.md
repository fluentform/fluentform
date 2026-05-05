---
name: commit-push-pr
description: Full git workflow — sync, stage, commit, push, and open a PR with a concise why-first description. Use when users ask to commit changes, push a branch, create a pull request, or do the full commit-push-PR flow in one step.
---

# Commit → Push → PR

Run the full git workflow: create/sync the feature branch, stage changes, commit, push, and open a PR with a quality description.

## Constraints

- Do NOT add any `Co-Authored-By` trailer anywhere — not in the commit message, not in the PR body. Never reference Claude/Anthropic as co-author.
- Commit subject and PR title use **Sentence case** after the prefix (only the first word capitalized; proper nouns/acronyms keep their case).
- If the user provides a **ticket/task/issue link or ID** before requesting the commit (e.g. Jira/Linear/GitHub/GitLab/Asana/ClickUp/Trello URL or `#123`/`PROJ-456`), capture it and include it in BOTH the commit message body AND the PR body. Never invent or guess a ticket reference; only use what the user supplied.

## Execution Workflow

### Step 1 — Determine branch target

- If on `master`, `main`, or `dev`, create a new feature branch first:
  - `git checkout -b <prefix>/<short-slug>` where prefix is `fix`, `feat`, `chore`, `docs`, etc.
- Otherwise, stay on the current branch.

### Step 2 — Sync feature branch with base

- Skip this step if the branch was just created from the latest base in Step 1.
- Otherwise:
  - `git fetch origin`
  - **Default — rebase** (solo fix/feature branches): `git rebase origin/dev`
  - **Merge instead** if the branch is shared with other contributors: `git merge origin/dev`
- Resolve any conflicts before continuing. If conflicts are non-trivial, surface them to the user — do not auto-resolve in ways that could lose work.

### Step 3 — Stage relevant files

- Run `git status` and `git diff HEAD` to review changes.
- Stage only files relevant to the change (`git add <paths>`).
- Skip:
  - `.env`, credentials, keys
  - `vendor/`, `node_modules/`
  - Unrelated edits
  - `mix-manifest.json` unless assets actually changed

### Step 4 — Commit

- Draft a commit message:
  - **Format** (matches `readme.txt` changelog style): `<Prefix>: <Sentence case subject>`.
  - Allowed prefixes (pick the closest fit):
    - `Add:` — new feature, option, field, hook, integration
    - `Fix:` — bug fix
    - `Update:` — adjustment to existing behavior, dependency, or copy
    - `Improve:` — enhancement to existing UI/UX/perf without behavior change
    - `Remove:` — removal of feature, file, or dependency
    - `Security:` — security patch, hardening, vulnerability fix
    - `Docs:` — documentation only
    - `Chore:` — tooling, build, config, non-functional housekeeping
    - `Release:` — version bump / release commit
    - `Hotfix:` — urgent patch on top of a release
  - Subject ≤72 chars, sentence case, no trailing period. Subject states the *what*.
  - Body (optional) states the *why* if non-obvious. Wrap at ~72 chars.
  - **Ticket reference**: if the user supplied a ticket link or ID earlier, append a trailer line after a blank line. Use the closing keyword that fits the work:
    - Bug fix → `Fixes: <url-or-id>`
    - Feature/task → `Refs: <url-or-id>` (or `Closes:` if the user said it completes the ticket)
    - Multiple tickets → one trailer line per reference.
  - No `Co-Authored-By` line. No Claude/AI attribution.
- Run `git commit`.

#### Commit subject examples

- `Fix: Preserve JSON escapes when importing form meta`
- `Add: Subscription support for payment calculations`
- `Update: Sanitize form_step and save_progress_button settings`
- `Security: Block event handlers in sanitized HTML`
- `Improve: ACL permission checks and helpers`
- `Remove: Unused legacy migrator stubs`

### Step 5 — Push

- First push: `git push -u origin <branch>` (sets upstream).
- Subsequent push after rebase: `git push --force-with-lease` (safer than `--force` — refuses to overwrite remote work you haven't seen).
- Subsequent push after merge: `git push` (no force needed).

### Step 6 — Resolve PR base branch

- Default base for fluentform: **`dev`**.
- Verify with upstream merge target if available; fall back to: `origin/dev` → `origin/master` → `origin/main`.
- Ambiguous: ask the user which base branch to target.

### Step 7 — Gather change evidence for PR body

- `git diff --name-status <base>...HEAD`
- `git diff --stat <base>...HEAD`
- `git log --oneline <base>..HEAD`
- Inspect changed files as needed to extract intent and testing details.

### Step 8 — Fill PR template

Resolve template path in order:
1. `.github/pull_request_template.md`
2. `.github/PULL_REQUEST_TEMPLATE.md`
3. `references/pull_request_template.default.md` (fallback)

#### Template section rules

**What does this PR do and why?** *(required)*
- First sentence: the underlying problem or need.
- Second sentence: the solution approach.
- Optional third: impact/scope boundary.
- If the user supplied a ticket link or ID, include it on its own line at the end of this section using the matching closing keyword (`Fixes #123`, `Closes PROJ-456`, `Refs: <url>`). Use full URL when given; raw IDs when given. Do not fabricate.

**Changes** *(conditional)*
- Include only if it adds meaningful reviewer context.
- 1–4 concise bullets by capability/area. No raw filenames.
- Omit when obvious or redundant.

**How to test** *(conditional)*
- Numbered steps with expected outcomes.
- Omit when no meaningful test flow is available.

**Screenshots** *(conditional)*
- Include only for visual UI changes. Omit otherwise.

**Anything the reviewer should know?** *(conditional)*
- Risks, trade-offs, migrations, rollout notes, known limits only.
- Omit when nothing material to flag.

### Step 9 — Open PR

- `gh pr create --base dev --title "<title>" --body "<filled-template>"`
- Title: same subject as the commit message, including the prefix (`Fix:`, `Add:`, `Improve:`, etc.).
- For multi-commit PRs, restate cleanly using the dominant prefix.
- Return the PR URL.

## Concision Rules

- Keep wording direct, plain, and compact.
- Remove filler and repeated statements.
- Prefer short sentences and concrete nouns/verbs.
- Keep overall output as short as possible without losing key context.

## Quality Gate

Verify before creating the PR:
- Opening section clearly answers *why* this PR is needed.
- Optional sections present only when meaningful.
- All statements are evidence-backed.
- No fluff, no bloat, no redundant details.
- Commit subject AND PR title use the `Prefix: Sentence case subject` pattern with a prefix that actually fits.
- If the user supplied a ticket reference, it appears in BOTH the commit body trailer AND the PR body. Never invented.
- No `Co-Authored-By` line anywhere in commit or PR body. No Claude/AI co-author attribution.
- Branch was synced with `origin/dev` before pushing (Step 2) — confirm no stale base.

## References

- `references/pull_request_template.default.md`
