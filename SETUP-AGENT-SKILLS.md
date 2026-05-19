# Setup Agent Skills Globally (One-Time)

This guide explains how to make agent-skills available **globally** across ALL projects on your PC.

**Note:** This is a one-time setup. Once done, all projects automatically have access to these skills.

## Quick Start (2 minutes)

### Step 1: Clone agent-skills

```bash
# Navigate to your Projects/Tools directory
cd /path/to/your/tools

# Clone the agent-skills repository
git clone https://github.com/your-org/agent-skills.git
# or if it's local
git clone /path/to/agent-skills
```

Expected result:
```
/path/to/tools/agent-skills/
├── plugin-audit/
├── debugger/
├── php-cs-fixer-style/
├── pr-descriptor/
├── agents-onboarding/
└── shared/
```

### Step 2: Create Global Symlinks

Claude Code loads skills from `~/.claude/skills/` globally. Create symlinks there:

```bash
# Create symlinks in your user's global Claude skills directory
ln -s /path/to/tools/agent-skills/plugin-audit/SKILL.md ~/.claude/skills/plugin-audit.md
ln -s /path/to/tools/agent-skills/debugger/SKILL.md ~/.claude/skills/debugger.md
ln -s /path/to/tools/agent-skills/php-cs-fixer-style/SKILL.md ~/.claude/skills/php-cs-fixer-style.md
ln -s /path/to/tools/agent-skills/pr-descriptor/SKILL.md ~/.claude/skills/pr-descriptor.md
ln -s /path/to/tools/agent-skills/agents-onboarding/SKILL.md ~/.claude/skills/agents-onboarding.md
```

### Step 3: Verify

```bash
ls -la ~/.claude/skills/ | grep -E "plugin-audit|debugger|php-cs-fixer|pr-descriptor|agents-onboarding"
```

Expected output (all should be symlinks):
```
lrwxr-xr-x  plugin-audit.md -> /path/to/tools/agent-skills/plugin-audit/SKILL.md
lrwxr-xr-x  debugger.md -> /path/to/tools/agent-skills/debugger/SKILL.md
lrwxr-xr-x  php-cs-fixer-style.md -> /path/to/tools/agent-skills/php-cs-fixer-style/SKILL.md
lrwxr-xr-x  pr-descriptor.md -> /path/to/tools/agent-skills/pr-descriptor/SKILL.md
lrwxr-xr-x  agents-onboarding.md -> /path/to/tools/agent-skills/agents-onboarding/SKILL.md
```

### Step 4: Use in Any Project

Open **any** project in Claude Code. The skills are now auto-loaded globally:

```
"Use the plugin-audit skill to review security on this branch."
"Use the debugger skill to find bugs with Finder → Verifier loop."
```

**No project-specific setup needed!**

---

## One-Liner Setup

```bash
AGENT_SKILLS_PATH=/path/to/tools/agent-skills && \
mkdir -p ~/.claude/skills && \
cd ~/.claude/skills && \
ln -s $AGENT_SKILLS_PATH/plugin-audit/SKILL.md plugin-audit.md && \
ln -s $AGENT_SKILLS_PATH/debugger/SKILL.md debugger.md && \
ln -s $AGENT_SKILLS_PATH/php-cs-fixer-style/SKILL.md php-cs-fixer-style.md && \
ln -s $AGENT_SKILLS_PATH/pr-descriptor/SKILL.md pr-descriptor.md && \
ln -s $AGENT_SKILLS_PATH/agents-onboarding/SKILL.md agents-onboarding.md && \
echo "✓ Global skills setup complete!"
```

## Keep Skills Updated

Agent skills are version controlled separately. When there are updates:

```bash
cd /path/to/tools/agent-skills
git pull origin main

# Symlinks automatically point to the latest version
# No changes needed in your projects!
```

## Troubleshooting

### Symlinks not appearing in Claude Code?

1. Verify symlinks exist and point to real files:
   ```bash
   ls -la ~/.claude/skills/plugin-audit.md
   cat ~/.claude/skills/plugin-audit.md  # Should show the SKILL.md content
   ```

2. Reload Claude Code (close and reopen)

### "Permission denied" when creating symlinks?

```bash
chmod 755 ~/.claude/skills/
```

### Symlinks broke after moving agent-skills?

Update symlink targets:
```bash
cd ~/.claude/skills
rm plugin-audit.md debugger.md ...
ln -s /new/path/to/agent-skills/*/SKILL.md .
```

---

## Reference

- **Source of Truth:** `/Volumes/Projects/Tools/agent-skills/`
- **Global Skills Dir:** `~/.claude/skills/` (auto-loaded by Claude Code)
- **Project Skills:** `.claude/skills/` (project-specific, optional)

All projects in `/Volumes/Projects/` now have automatic access to these 5 agent skills.
