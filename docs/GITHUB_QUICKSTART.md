# GitHub Quickstart

This project is connected to:

- `https://github.com/angusm99/AluQuote`

## Everyday workflow

1. Open the project folder locally:

   ```powershell
   cd "C:\Users\User\Documents\New project"
   ```

2. Start the app locally:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\start.ps1
   ```

3. Make changes in the code.
4. Test the calculator in the browser at `http://127.0.0.1:8000`.
5. Commit and push changes to GitHub.

## Useful git commands

Check what changed:

```powershell
git status
```

See changed files:

```powershell
git diff --stat
```

Save changes to git:

```powershell
git add -A
git commit -m "Describe what changed"
```

Send changes to GitHub:

```powershell
git push origin main
```

Get the latest from GitHub:

```powershell
git pull origin main
```

## If something feels confusing

- `git status` is the safest first command
- `main` is the primary branch for this repo
- keep the app running locally while testing UI changes
- avoid deleting files from git unless you are sure they are no longer needed
