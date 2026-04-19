# Codex Prompt for GitHub Setup

Use this prompt in another local project when you want Codex to inspect it, organize it, connect it to GitHub, and push it cleanly.

## Copy/paste prompt

```text
This project needs a full GitHub setup and cleanup.

Please do the following end to end:

1. Inspect the local project first so you understand what it is, how it runs, and what files matter.
2. Organize the repo so it is GitHub-friendly:
   - improve or rewrite README.md
   - add a .gitignore if needed
   - add CONTRIBUTING.md if useful
   - add a docs/GITHUB_QUICKSTART.md for simple day-to-day use
   - add .github templates or workflows where they are actually helpful
3. Check the current git state:
   - inspect branches, remotes, and status
   - connect to my GitHub account/repo
   - if the repo already exists, merge safely instead of overwriting
   - if a remote URL is wrong, fix it
4. Commit and push the project to the correct GitHub repository.
5. Explain clearly what you changed, what repo/branch was used, and what I should do next.

Important:
- Do not delete unrelated work.
- Prefer the existing GitHub repo if there is an obvious correct one.
- If there are multiple candidate repos, pause and tell me the options.
- If useful, add lightweight GitHub Actions, issue templates, and a PR template.
- Keep the explanations simple because my GitHub knowledge is limited.
```

## Better prompt when the project has a live design or reference app

```text
This project already has a reference build or design. I want you to:

- inspect the local codebase
- use the reference files or live site as the design source of truth
- update the local app to match that look and feel as closely as practical
- organize the repository for GitHub
- connect it to the correct repo on my GitHub
- merge and push safely
- leave me with a README and a simple GitHub quickstart guide

Assume I want you to act autonomously unless there is a risky decision.
```

## What worked well in this project

- Start with repo inspection before editing
- Fix the remote URL before pushing if it points at the wrong repo
- Merge unrelated histories safely instead of forcing a push
- Add simple GitHub scaffolding after the app is working
- Leave behind plain-English docs for future you
