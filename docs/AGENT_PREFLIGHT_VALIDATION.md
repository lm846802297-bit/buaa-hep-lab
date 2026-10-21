# Cross-tool Agent preflight validation

## Purpose

The repository stores one source of truth in `AGENTS.md` and `docs/PARALLEL_DEVELOPMENT_WORKFLOW.md`. Tool-specific files are discovery adapters; they do not create independent policy. A file being present in GitHub does not prove that a particular agent surface loaded it, so verify each tool in a fresh session.

## Tool entry points

| Tool | Repository instruction entry point | How to verify that it is active |
|---|---|---|
| Codex | `AGENTS.md` | Ask the agent to identify the repository instructions it read; check that it names `AGENTS.md` and the parallel workflow. |
| Claude Code | `CLAUDE.md` | Start a new session and inspect `/memory` for the project instruction file. |
| Gemini CLI | `GEMINI.md` | Start a new session and inspect `/memory show` or `/memory list`. |
| Antigravity | Root `AGENTS.md` / `GEMINI.md` | In a new workspace session, ask it to identify the loaded project rules before requesting edits. |
| Cursor | `.cursor/rules/parallel-development.mdc` | Check the Active Rules panel for the always-applied project rule. |
| Windsurf | `.windsurf/rules/parallel-development.md` | Check the workspace rule/customizations view and confirm the always-on rule is active. |
| GitHub Copilot | `.github/copilot-instructions.md` | In supported Chat/CLI surfaces, inspect the response references or loaded instruction files; repository instruction support varies by client and settings. |

A new session may be required after instruction files change. Do not assume that an already-running agent has reloaded them.

## Read-only behavior test

Run these checks in each tool's own checkout and task branch. Do not edit or commit files during this test.

1. Confirm the current branch is not `main`, the working tree is suitable for a preflight, and the local base is current.
2. Ask the agent to report the instruction files it actually loaded. It must identify the source-of-truth rules, not merely claim that “project rules” exist.
3. Run the known-overlap probe:

   ```bash
   node scripts/agent-preflight.mjs --paths frontend/src/index.css
   ```

   Expected: exit code `2` while open theme/topic PRs still touch this shared file. The agent must stop and must not edit the file.

4. Run a low-conflict probe:

   ```bash
   node scripts/agent-preflight.mjs --paths docs/AGENT_PREFLIGHT_VALIDATION.md
   ```

   Expected: no exact path overlap, provided the task branch contains the current base and no other open PR claims this path. This tests the checker, not semantic independence.
5. Record the tool, client/version, active instruction files, base SHA, output of both probes, and whether the agent refrained from writes after the blocked result.

If `gh` CLI is unavailable, use the authorized GitHub API/connector to perform the equivalent read-only check and record the main SHA, every relevant open PR HEAD SHA, and its changed-file list. Never skip the check or use an override merely to make the probe pass.

## Limits

- The offline `node scripts/agent-preflight.mjs --self-test` verifies overlap detection logic only. It does not prove that a third-party agent loaded or obeyed its rules.
- The overlap checker compares exact paths. It cannot infer shared APIs, runtime behavior, or semantic dependencies.
- A passing preflight does not replace review, current-HEAD CI, or post-merge/deployment verification.
- Tool-specific rule support can vary by client version, settings, workspace trust, and enterprise policy. If a file is not active, fix the tool's configuration rather than assuming the policy was enforced.
