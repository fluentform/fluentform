# Workflow: Commits & Pull Requests

Read this when asked to commit, push, or create a PR for FluentForm.

## Base Branch

Base branch (PR target): `dev`

## Step-by-Step: Commit & Push for PR

### 1. Create a feature branch from dev

```bash
git checkout -b feature/short-description   # or fix/short-description
```

### 2. Build if needed

If you changed Vue/JS/SCSS files:
```bash
npm run production    # Rebuild assets before committing
```

### 3. Stage only relevant files

```bash
git add app/Http/Controllers/FormController.php resources/assets/admin/views/FormEditor.vue assets/js/editor_app.js
```

Do NOT stage:
- `vendor/` files
- `node_modules/`
- Unrelated changes
- `.env` or credentials
- `mix-manifest.json` (unless assets changed)

### 4. Write the commit message

```bash
git commit -m "$(cat <<'EOF'
Fix: Conditional logic not evaluating on multi-step forms

PR: Fix conditional logic on multi-step forms

## What does this PR do and why?

Fixes conditional logic evaluation when fields are on different form steps. Previously, conditions referencing fields on other steps would not trigger because step visibility wasn't accounted for.

**Related issue:** N/A

## Scope

- [x] Free plugin
- [ ] Pro plugin

## Changes

- [x] PHP (ConditionAssesor, FormBuilder)
- [x] Vue/JS (conditional_logic.js)

## How to test

1. Create a multi-step form with 3 steps
2. Add a condition on step 3 that depends on a field on step 1
3. Fill in step 1, advance to step 3
4. Verify the condition evaluates correctly

## Anything the reviewer should know?

This changes the condition evaluator to check all step fields, not just the current step.
EOF
)"
```

### 5. Push with `-u` flag

```bash
git push -u origin fix/conditional-logic-multistep
```

## Important Rules

1. **No `Co-Authored-By` lines** — do not add co-author attribution
2. **No backticks in commit messages** — the auto PR bot fails to parse them. Use quotes instead
3. **Branch from dev** — always create feature/fix branches from `dev`
4. **Rebase before pushing** — `git rebase dev` to catch conflicts early
5. **Only stage relevant files** — exclude vendor/, node_modules/, unrelated changes
6. **Be specific in Changes** — name actual files, not generic categories
7. **Build before committing** — if JS/Vue/SCSS changed, run `npm run production` first
8. **Include compiled assets** — if source files changed, include the compiled `assets/` output
9. **PR title concise** — describe the what, not the how

## FluentForm-Specific Notes

- If your change touches form rendering, test both shortcode and Gutenberg block
- If your change touches the form editor, test drag-drop, field settings, and save
- Test with conversational forms if applicable
- Check that Pro features still work (payment fields, integrations) if you touched shared code
- The `actions.php` and `filters.php` files are very large (42k+ LOC) — be precise with changes
