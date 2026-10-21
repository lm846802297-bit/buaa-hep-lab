# Gemini CLI project entry point

# Mandatory repository instructions

This file is a tool-specific entry point, not a second source of truth. Before changing anything, read:
1. `AGENTS.md`
2. `docs/PARALLEL_DEVELOPMENT_WORKFLOW.md`
3. For implementation work, `.agents/skills/vibe-coding-lab-orbit/SKILL.md`
4. The relevant architecture map and current code/configuration.

Before any source-file write, list every planned repository-relative path and run:
```bash
node scripts/agent-preflight.mjs --paths <path1> <path2> ...
```
If the command fails, the branch is stale, or any open PR shares a planned path, stop before editing. Coordinate ownership/merge order or choose non-overlapping work. Do not use `--allow-overlap` or `--allow-stale-base` unless the user explicitly authorizes that exception. If `gh` CLI is unavailable, perform the same read-only check through an authorized GitHub API/connector and record the current base SHA, open PR HEAD SHAs, and changed-file lists; do not skip the check.

Use a dedicated task branch and PR; never push directly to `main`. Validate the current PR HEAD SHA, not an older commit. Do not deploy, write to remote D1, migrate production data, or change production resources without explicit user authorization. Keep this file concise and follow `AGENTS.md` if any instruction appears inconsistent.