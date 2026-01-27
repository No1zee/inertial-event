# NovaStream CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline implemented for NovaStream, a Next.js + Electron streaming application.

## Architecture

### Pipeline Stages

1. **Quality Gates & Testing**
   - TypeScript strict mode checking
   - ESLint code quality checks
   - Unit tests with Jest (minimum 80% coverage)
   - Security vulnerability scanning
   - Backend integration tests
   - End-to-end tests with Playwright

2. **Build & Security**
   - Multi-platform builds (Linux, Windows, macOS)
   - Docker containerization
   - Container security scanning with Trivy
   - CodeQL static analysis

3. **Deployment**
   - Staging deployments for develop branch
   - Production deployments for main branch
   - Automated releases for version tags
   - Electron distribution management

4. **Monitoring & Notifications**
   - Health checks and performance validation
   - Slack notifications
   - Artifact management

## Files Structure

```
.github/
├── workflows/
│   ├── ci-cd.yml          # Main CI/CD pipeline
│   └── electron-release.yml # Electron release workflow
├── scripts/
│   ├── build.sh           # Build automation
│   ├── deploy.sh          # Deployment automation
│   ├── security-scan.sh   # Security scanning
│   └── database.sh        # Database operations
├── nginx/
│   └── nginx.conf         # Reverse proxy configuration
├── monitoring/
│   ├── prometheus.yml     # Prometheus configuration
│   └── grafana/           # Grafana dashboards and datasources
├── migrations/            # Database migration scripts
├── .env.staging           # Staging environment variables
└── .env.production        # Production environment variables
├── docker-compose.yml     # Local development setup
└── Dockerfile             # Production container image
```

## Required Secrets

### GitHub Repository Secrets
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID
- `SLACK_WEBHOOK_URL` - Slack notification webhook
- `MONGODB_URI` - Production MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `SENTRY_DSN` - Sentry error tracking DSN

### Electron Code Signing Secrets
- `APPLE_ID` - Apple Developer ID
- `APPLE_PASSWORD` - Apple Developer password
- `APPLE_CERT` - Apple Developer certificate (base64)
- `APPLE_CERT_PASSWORD` - Apple certificate password
- `WINDOWS_CERT` - Windows code signing certificate (base64)
- `WINDOWS_CERT_PASSWORD` - Windows certificate password

### Monitoring Secrets
- `GRAFANA_USER` - Grafana admin username
- `GRAFANA_PASSWORD` - Grafana admin password

## Usage

### Manual Deployment

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production
./scripts/deploy.sh production
```

### Database Operations

```bash
# Create backup
./scripts/database.sh staging backup

# Run migrations
./scripts/database.sh production migrate

# Restore from backup
./scripts/database.sh staging restore backup_file.tar.gz
```

### Security Scanning

```bash
# Run full security assessment
./scripts/security-scan.sh
```

### Local Development

```bash
# Start full stack locally
docker-compose up -d

# Start individual services
docker-compose up -d novastream mongodb redis
```

## Quality Gates

### Code Quality
- TypeScript strict mode: No errors
- ESLint: No warnings or errors
- Test coverage: Minimum 80% line coverage

### Security
- No high or critical vulnerabilities (npm audit)
- CodeQL: No security issues
- Container scan: No high/critical vulnerabilities
- Secrets: No hardcoded secrets detected

### Performance
- Bundle size limits enforced
- Lighthouse score: Minimum 80 for production
- Health checks: All endpoints responsive

## Deployment Environments

### Staging
- URL: https://staging.novastream.app
- Branch: develop
- Database: novastream-staging
- Auto-deployment: On push to develop

### Production
- URL: https://novastream.app
- Branch: main
- Database: novastream
- Auto-deployment: On push to main

## Release Process

1. **Development** - Work on feature branches
2. **Testing** - Push to develop for automated testing and staging deployment
3. **Production** - Merge to main for production deployment
4. **Release** - Create version tag for automated Electron releases

### Release Versioning

```bash
# Create new release
git tag v1.0.0
git push origin v1.0.0

# Pre-release
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1
```

## Monitoring

### Metrics Collection
- Application metrics via `/api/metrics`
- Infrastructure metrics via Prometheus exporters
- Error tracking via Sentry
- Performance monitoring via Lighthouse

### Logging
- Structured JSON logging
- Centralized log aggregation with ELK stack
- Log retention policies implemented

### Alerts
- High error rate alerts
- Performance degradation alerts
- Security vulnerability alerts
- Deployment failure notifications

## Rollback Procedures

### Application Rollback
```bash
# Vercel rollback
npx vercel rollback <deployment-url>

# Docker rollback
docker-compose down
docker-compose up -d --force-recreate
```

### Database Rollback
```bash
# Restore from backup
./scripts/database.sh production restore backup_file.tar.gz
```

### Emergency Procedures
1. Immediate rollback to previous working version
2. Create incident in issue tracker
3. Notify team via Slack
4. Investigate root cause
5. Implement fix and test thoroughly
6. Re-deploy with confidence

## Best Practices

### Code Quality
- Write comprehensive tests
- Use TypeScript strict mode
- Follow ESLint rules
- Regular code reviews

### Security
- Regular dependency updates
- Security scanning in CI/CD
- Environment-specific secrets
- Principle of least privilege

### Performance
- Optimize bundle sizes
- Implement caching strategies
- Monitor resource usage
- Performance budgets

### Reliability
- Health checks for all services
- Graceful error handling
- Circuit breakers for external services
- Comprehensive logging

## Troubleshooting

### Common Issues

**Build failures:**
- Check Node.js version compatibility
- Verify all dependencies installed
- Review build logs for specific errors

**Test failures:**
- Check test environment setup
- Verify test data and mocks
- Review flaky test scenarios

**Deployment failures:**
- Verify environment variables
- Check service connectivity
- Review deployment logs

**Security scan failures:**
- Update vulnerable dependencies
- Review and fix code security issues
- Update security scanning rules

### Debug Commands

```bash
# Check build artifacts
ls -la out/ dist-server/ dist/

# Test locally
npm run test:ci

# Security scan locally
npm audit --audit-level=moderate

# Database connectivity test
node -e "require('mongodb').MongoClient.connect('$MONGODB_URI').then(() => console.log('DB OK')).catch(console.error)"
```

## Support

For CI/CD issues, contact the DevOps team or create an issue in the repository with:
- Environment (staging/production)
- Error logs and screenshots
- Steps to reproduce
- Expected vs actual behavior