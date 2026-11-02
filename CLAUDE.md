# Working in this repo

Read `AGENTS.md` (Next.js version warning) and `CONTEXT.md` (vocabulary) first.

## One issue, one branch, one worktree

Every change is tied to one GitHub issue, and the issue number appears in all three places:

| Thing              | Rule                                                                                                                          | Example (issue #5)                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Branch             | `<type>/<issue>-<slug>`; type is `feat`, `fix`, `docs`, `chore`, `refactor` or `test`; slug is lower-case words joined by `-` | `feat/5-walk-the-board`                   |
| Worktree directory | The branch with `/` replaced by `-`, under `.claude/worktrees/`                                                               | `.claude/worktrees/feat-5-walk-the-board` |
| Pull request       | Base `main`; the body contains `Closes #<issue>`                                                                              | `Closes #5`                               |

- No issue yet? Create the issue first, then the branch. Do not work on `main` or in the main checkout.
- Create a worktree with `git worktree add .claude/worktrees/<dir> -b <branch> origin/main`. If the app or an agent created one with a generated name, rename it before the first commit: `git branch -m <branch>` and `git worktree move <old-path> .claude/worktrees/<dir>`.
- When you hand an issue to a subagent, give it the exact branch name and directory.
- `.github/branch-policy.json` holds the branch pattern. `node C:/Users/marcc/.claude/scripts/check-worktree.mjs` checks the branch, directory, issue and PR together and prints a PROBLEM for any mismatch. Run it before building, committing or opening a PR.
- Commit messages and PR descriptions carry no attribution lines.

## Agent skills

### Issue tracker

Issues for this repo live in GitHub Issues; use `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: read the root `CONTEXT.md` and relevant ADRs under `docs/adr/`. See `docs/agents/domain.md`.
