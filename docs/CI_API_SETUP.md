# CI API Integration Setup

This document explains how to configure API calls for CI test reporting and notifications in ApexFlow.

## Overview

The enhanced CI workflow includes:
- **Test Results Reporting**: JUnit XML output and coverage reports
- **API Webhooks**: Custom webhook endpoints for CI status updates  
- **Chat Notifications**: Slack and Discord integration
- **PR Comments**: Automated test result comments on pull requests
- **Coverage Reporting**: Integration with Codecov or similar services

## Required GitHub Secrets

Set these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Webhook Configuration
```bash
CI_WEBHOOK_URL=https://your-server.com/webhook/ci
STATUS_API_TOKEN=your-webhook-auth-token
```

### Chat Integrations
```bash
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Discord  
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK
```

### Coverage Reporting
```bash
CODECOV_TOKEN=your-codecov-token
```

## Webhook Payload Format

When CI completes, a webhook will be sent with this payload structure:

```json
{
  "event": "ci_completed",
  "status": "success|failure|partial",
  "repository": "owner/repo-name",
  "branch": "branch-name",
  "commit": {
    "sha": "commit-hash",
    "message": "commit message",
    "author": "author-name",
    "url": "https://github.com/owner/repo/commit/hash"
  },
  "build": {
    "number": "123",
    "url": "https://github.com/owner/repo/actions/runs/123",
    "duration": null,
    "started_at": "2025-01-01T00:00:00Z",
    "finished_at": "2025-01-01T00:05:00Z"
  },
  "tests": {
    "status": "success|failure",
    "total_workspaces": 7,
    "workspaces": {
      "api-gateway": "executed",
      "pdf-workflows": "executed", 
      "react-web": "executed",
      "agent-orchestrator": "no-tests",
      "slack-bot": "no-tests",
      "shared": "no-tests",
      "types": "no-tests"
    }
  },
  "security": {
    "status": "success|failure",
    "audit_level": "high"
  }
}
```

## Setting Up Webhook Endpoint

### Option 1: Use the Sample Server

Deploy the provided webhook server:

```bash
# Copy the sample webhook server
cp scripts/ci-webhook-example.js webhook-server.js

# Install dependencies (if needed)
npm install

# Set environment variables
export WEBHOOK_SECRET="your-secret-token"
export PORT=3333
export FORWARD_URL="https://your-monitoring-system.com/api/ci"
export FORWARD_TOKEN="monitoring-system-token"

# Run the server
node webhook-server.js
```

### Option 2: Deploy to Serverless

Deploy to AWS Lambda, Vercel, Netlify Functions, or similar:

```javascript
// Serverless function example (Vercel)
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const payload = req.body;
  
  // Process CI webhook
  console.log('CI Status:', payload.status);
  console.log('Tests:', payload.tests.status);
  
  // Your custom logic here
  // - Save to database
  // - Update dashboard
  // - Send notifications
  
  res.status(200).json({ success: true });
}
```

### Option 3: Direct Integration

Integrate directly with your existing systems:

```bash
# Examples of webhook URLs
CI_WEBHOOK_URL=https://api.datadog.com/api/v1/events
CI_WEBHOOK_URL=https://your-grafana.com/api/annotations
CI_WEBHOOK_URL=https://your-app.com/api/ci-status
```

## Test Result Files

The CI generates these files for analysis:

```
project-root/
├── coverage/
│   ├── lcov.info           # Coverage data for Codecov
│   ├── coverage-summary.json  # Coverage summary
│   └── index.html          # Coverage report
├── test-results/
│   └── junit.xml           # JUnit test results
└── apps/*/coverage/        # Per-workspace coverage
```

## Chat Integration Setup

### Slack Setup

1. Create a Slack app: https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Create webhook for your channel
4. Add `SLACK_WEBHOOK_URL` secret to GitHub

### Discord Setup

1. Go to your Discord server settings
2. Integrations > Webhooks > New Webhook
3. Copy webhook URL
4. Add `DISCORD_WEBHOOK_URL` secret to GitHub

## Coverage Integration Setup

### Codecov Setup

1. Sign up at https://codecov.io
2. Connect your GitHub repository  
3. Get your repository token
4. Add `CODECOV_TOKEN` secret to GitHub

### Alternative Coverage Services

You can also integrate with:
- **Coveralls**: `COVERALLS_REPO_TOKEN`
- **Code Climate**: `CC_TEST_REPORTER_ID`  
- **SonarCloud**: Configure in sonar-project.properties

## Local Testing

Test the CI reporting locally:

```bash
# Run tests with CI configuration
npm run test:ci

# Check generated files
ls -la coverage/
ls -la test-results/

# Test webhook server
node scripts/ci-webhook-example.js &

# Send test webhook
curl -X POST http://localhost:3333/webhook/ci \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret" \
  -d '{"event":"ci_completed","status":"success","repository":"test/repo"}'
```

## Monitoring and Debugging

### Check CI Logs

View detailed logs in GitHub Actions:
1. Go to Actions tab in your repository
2. Click on the failing workflow run
3. Expand the "Report CI status" step

### Test Webhook Delivery

```bash
# Test webhook connectivity
curl -X POST $CI_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STATUS_API_TOKEN" \
  -d '{"test": true}'

# Check webhook server logs
tail -f webhook-server.log
```

### Common Issues

1. **Webhook timeouts**: Ensure your endpoint responds quickly (< 10s)
2. **Authentication failures**: Verify `STATUS_API_TOKEN` matches
3. **Missing coverage**: Check Jest configuration in workspace projects  
4. **JUnit XML not generated**: Verify `jest-junit` is installed

## Advanced Configuration

### Custom Test Reporters

Add custom reporters to Jest configuration:

```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    'jest-junit',
    ['jest-html-reporters', {
      publicPath: './test-reports',
      filename: 'test-report.html'
    }]
  ]
};
```

### Custom Webhook Logic

Enhance the CI workflow with custom logic:

```yaml
# .github/workflows/ci.yml
- name: Custom API Integration
  run: |
    # Your custom API calls
    curl -X POST https://your-api.com/builds \
      -H "Authorization: Bearer ${{ secrets.API_TOKEN }}" \
      -d '{
        "build_id": "${{ github.run_id }}",
        "status": "completed",
        "test_results": "'$(cat test-results/junit.xml | base64 -w 0)'"
      }'
```

### Quality Gates

Set up quality gates based on coverage:

```yaml
- name: Quality Gate
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 80% threshold"
      exit 1
    fi
```

## Security Considerations

- **Webhook secrets**: Always use authentication tokens
- **Sensitive data**: Don't include secrets in webhook payloads
- **Network security**: Use HTTPS for all webhook endpoints
- **Rate limiting**: Implement rate limiting on webhook endpoints
- **Validation**: Validate webhook payloads before processing

## Support

If you encounter issues with CI API integration:

1. Check GitHub Actions logs
2. Verify all required secrets are set
3. Test webhook endpoints independently
4. Review Jest configuration for test reporting
5. Consult the troubleshooting section above