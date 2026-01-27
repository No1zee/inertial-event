#!/bin/bash

# Security scanning and vulnerability assessment
set -e

echo "🔒 Starting security assessment for NovaStream..."

# Create reports directory
mkdir -p security-reports
cd security-reports

# 1. npm audit for dependency vulnerabilities
echo "📦 Scanning npm dependencies for vulnerabilities..."
npm audit --audit-level=moderate --json > npm-audit.json
npm audit --audit-level=moderate

# Check for high/critical vulnerabilities
HIGH_VULNS=$(cat npm-audit.json | jq '.metadata.vulnerabilities.high // 0')
CRITICAL_VULNS=$(cat npm-audit.json | jq '.metadata.vulnerabilities.critical // 0')

if [[ $HIGH_VULNS -gt 0 || $CRITICAL_VULNS -gt 0 ]]; then
    echo "❌ Found $HIGH_VULNS high and $CRITICAL_VULNS critical vulnerabilities"
    exit 1
else
    echo "✅ No high or critical vulnerabilities found"
fi

# 2. Snyk vulnerability scanning (if available)
if command -v snyk &> /dev/null; then
    echo "🔍 Running Snyk vulnerability scan..."
    snyk test --json > snyk-report.json || true
    snyk monitor --org=novastream || true
fi

# 3. CodeQL analysis (GitHub Actions handles this, but we can run locally)
if command -v codeql &> /dev/null; then
    echo "🔍 Running CodeQL analysis..."
    codeql database create codeql-db --language=javascript
    codeql database analyze codeql-db --format=sarif-latest --output=codeql-results.sarif
    codeql sarif summarize codeql-results.sarif --format=summary > codeql-summary.txt
fi

# 4. Secrets scanning with GitLeaks
if command -v gitleaks &> /dev/null; then
    echo "🔍 Scanning for secrets with GitLeaks..."
    gitleaks detect --source=../ --verbose --report-format=json --report-path=gitleaks-report.json || true
fi

# 5. Bandit for security linting (Python files, if any)
if find ../ -name "*.py" | head -1 &> /dev/null; then
    echo "🔍 Running Bandit security linter..."
    bandit -r ../ -f json -o bandit-report.json || true
fi

# 6. OWASP ZAP Baseline Scan (requires running application)
echo "🌐 Starting OWASP ZAP baseline scan..."
if command -v docker &> /dev/null; then
    # Start the application for scanning
    cd ..
    npm start &
    APP_PID=$!
    sleep 30  # Wait for app to start
    
    cd security-reports
    docker run -t owasp/zap2docker-stable zap-baseline.py \
        -t http://localhost:3000 \
        -J zap-report.json \
        -I || true
    
    # Kill the application
    kill $APP_PID 2>/dev/null || true
fi

# 7. Generate security report summary
echo "📊 Generating security report summary..."
cat > security-summary.md << EOF
# NovaStream Security Assessment Report

**Date:** $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)
**Commit:** ${GITHUB_SHA:-$(git rev-parse HEAD)}

## Dependency Vulnerabilities
- High: $HIGH_VULNS
- Critical: $CRITICAL_VULNS

## Files Analyzed
- npm audit report: npm-audit.json
- Snyk scan: $(test -f snyk-report.json && echo "Available" || echo "Not available")
- CodeQL: $(test -f codeql-results.sarif && echo "Available" || echo "Not available")
- GitLeaks: $(test -f gitleaks-report.json && echo "Available" || echo "Not available")
- OWASP ZAP: $(test -f zap-report.json && echo "Available" || echo "Not available")

## Recommendations
1. Address all high and critical vulnerabilities immediately
2. Implement regular dependency updates
3. Use Snyk for continuous dependency monitoring
4. Implement secrets scanning in CI/CD pipeline
5. Regular security reviews and penetration testing

EOF

echo "✅ Security assessment completed!"
echo "📁 Reports available in security-reports/"
echo "📊 Summary: security-reports/security-summary.md"

# Exit with error if critical issues found
if [[ $HIGH_VULNS -gt 0 || $CRITICAL_VULNS -gt 0 ]]; then
    echo "❌ Security assessment failed - critical vulnerabilities found"
    exit 1
fi