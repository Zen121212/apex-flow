# ApexFlow Git Branching Strategy

## Branch Structure

### Main Branches
- `main` - Production-ready code
- `dev` - Integration branch for all features

### Feature Branches (create from `dev`)
- `feature/frontend-angular` - Angular web application development
- `feature/api-gateway` - API Gateway service development  
- `feature/pdf-workflows` - PDF processing workflows
- `feature/slack-bot` - Slack integration bot
- `feature/agent-orchestrator` - AI agent orchestration service
- `feature/shared-packages` - Shared libraries and types

### Optional Supporting Branches
- `feature/infrastructure` - Docker, deployment, CI/CD
- `feature/docs` - Documentation updates
- `hotfix/*` - Critical production fixes (branch from `main`)

## Workflow

### 1. Starting New Feature Work
```bash
# Make sure you're on dev and up to date
git checkout dev
git pull origin dev

# Create and switch to feature branch
git checkout -b feature/[component-name]
```

### 2. Working on Features
```bash
# Regular commits to your feature branch
git add .
git commit -m "feat(component): description of changes"
git push origin feature/[component-name]
```

### 3. Merging Back to Dev
```bash
# Update your feature branch with latest dev
git checkout dev
git pull origin dev
git checkout feature/[component-name]
git merge dev  # or rebase if preferred

# Push updated feature branch
git push origin feature/[component-name]

# Create Pull Request to merge into dev
# After PR approval, delete feature branch
git branch -d feature/[component-name]
```

### 4. Release to Production
```bash
# When dev is stable and ready for release
git checkout main
git pull origin main
git merge dev
git push origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

## Component-Specific Guidelines

### Frontend (Angular)
- **Branch**: `feature/frontend-angular`
- **Focus**: UI components, routing, state management
- **Files**: `apps/angular-web/`

### API Gateway
- **Branch**: `feature/api-gateway`  
- **Focus**: REST API endpoints, authentication, routing
- **Files**: `apps/api-gateway/`

### PDF Workflows
- **Branch**: `feature/pdf-workflows`
- **Focus**: Document processing, OCR, workflow automation
- **Files**: `apps/pdf-workflows/`

### Slack Bot
- **Branch**: `feature/slack-bot`
- **Focus**: Slack integration, bot commands, notifications
- **Files**: `apps/slack-bot/`

### Agent Orchestrator  
- **Branch**: `feature/agent-orchestrator`
- **Focus**: AI agent coordination, task scheduling
- **Files**: `apps/agent-orchestrator/`

### Shared Components
- **Branch**: `feature/shared-packages`
- **Focus**: Common utilities, types, client libraries
- **Files**: `packages/`

## Best Practices

1. **Keep feature branches focused** - One branch per major component
2. **Regular integration** - Merge dev into feature branches frequently
3. **Atomic commits** - Each commit should represent a single logical change
4. **Descriptive commit messages** - Use conventional commit format
5. **Test before merging** - Ensure all tests pass before PR
6. **Clean up** - Delete feature branches after merging

## Commit Message Convention
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: frontend, api, pdf, slack, agent, shared, infra
```

Examples:
- `feat(frontend): add document upload component`
- `fix(api): resolve authentication middleware bug`
- `docs(readme): update installation instructions`
