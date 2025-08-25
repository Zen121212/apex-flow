# ApexFlow Branch Quick Reference

## Available Branches ✅

All feature branches have been created from `dev`. Here's what each branch is for:

### 🎯 Choose Your Branch

| Component | Branch Name | Focus Area | Command to Switch |
|-----------|-------------|------------|------------------|
| **Angular Frontend** | `feature/frontend-angular` | Web UI, components, routing | `git checkout feature/frontend-angular` |
| **API Gateway** | `feature/api-gateway` | REST APIs, authentication | `git checkout feature/api-gateway` |
| **PDF Workflows** | `feature/pdf-workflows` | Document processing, OCR | `git checkout feature/pdf-workflows` |
| **Slack Bot** | `feature/slack-bot` | Slack integration, bot commands | `git checkout feature/slack-bot` |
| **Agent Orchestrator** | `feature/agent-orchestrator` | AI agents, task coordination | `git checkout feature/agent-orchestrator` |
| **Shared Packages** | `feature/shared-packages` | Common libs, types, utilities | `git checkout feature/shared-packages` |
| **Infrastructure** | `feature/infrastructure` | Docker, CI/CD, deployment | `git checkout feature/infrastructure` |

## 🚀 Quick Start Workflow

### 1. Start Working on a Component
```bash
# Switch to the component you want to work on
git checkout feature/[component-name]

# Apply any stashed changes if relevant to this component
git stash list
git stash apply  # if needed

# Start coding!
```

### 2. Save Your Progress
```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat(component): describe what you built"

# Push to remote (first time)
git push -u origin feature/[component-name]

# Push subsequent changes
git push
```

### 3. Stay Up to Date
```bash
# Periodically sync with dev branch
git checkout dev
git pull origin dev
git checkout feature/[component-name]
git merge dev
```

### 4. Merge Back to Dev
```bash
# When feature is complete, merge back to dev
git checkout dev
git pull origin dev
git merge feature/[component-name]
git push origin dev
```

## 📁 Current Stashed Changes

Your previous work is safely stashed. To see what's stashed:
```bash
git stash list
git stash show -p  # to see the changes
```

To apply stashed changes to the relevant branch:
```bash
git checkout feature/[relevant-branch]
git stash apply
```

## 🔄 Branch Status

- ✅ `main` - Production branch
- ✅ `dev` - Integration branch (your base)
- ✅ `feature/frontend-angular` - Ready for Angular development
- ✅ `feature/api-gateway` - Ready for API development
- ✅ `feature/pdf-workflows` - Ready for PDF processing work
- ✅ `feature/slack-bot` - Ready for Slack integration
- ✅ `feature/agent-orchestrator` - Ready for AI agent work
- ✅ `feature/shared-packages` - Ready for shared utilities
- ✅ `feature/infrastructure` - Ready for DevOps work

## 💡 Pro Tips

1. **Work on one component at a time** - Switch branches based on what you're building
2. **Commit frequently** - Small, focused commits are easier to manage
3. **Push regularly** - Don't lose your work
4. **Merge dev often** - Stay up to date with other changes
5. **Use descriptive commit messages** - Future you will thank you

## 🆘 Need Help?

- View all branches: `git branch -a`
- See current branch: `git branch`
- See what's changed: `git status`
- See commit history: `git log --oneline`
- Undo last commit (keep changes): `git reset --soft HEAD~1`
