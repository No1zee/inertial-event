#!/bin/bash

# Deployment script for NovaStream environments
set -e

# Configuration
ENVIRONMENT=${1:-staging}
REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME="novastream"

echo "🚀 Deploying NovaStream to $ENVIRONMENT environment..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Load environment-specific variables
ENV_FILE=".env.$ENVIRONMENT"
if [[ ! -f "$ENV_FILE" ]]; then
    echo "❌ Environment file $ENV_FILE not found"
    exit 1
fi

echo "📝 Loading environment variables from $ENV_FILE"
source "$ENV_FILE"

# Check required environment variables
required_vars=("VERCEL_TOKEN" "VERCEL_ORG_ID" "VERCEL_PROJECT_ID")
for var in "${required_vars[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ Required environment variable $var is not set"
        exit 1
    fi
done

# Deploy frontend to Vercel
echo "🌐 Deploying frontend to Vercel..."
if [[ "$ENVIRONMENT" == "production" ]]; then
    npx vercel --prod --token="$VERCEL_TOKEN"
else
    npx vercel --token="$VERCEL_TOKEN"
fi

# Deploy backend (placeholder - implement based on your cloud provider)
echo "🏗️ Deploying backend..."
case "$ENVIRONMENT" in
    "staging")
        echo "Deploying to staging environment..."
        # Add your staging backend deployment commands here
        # Example: AWS ECS, Heroku, DigitalOcean, etc.
        ;;
    "production")
        echo "Deploying to production environment..."
        # Add your production backend deployment commands here
        # Example: AWS ECS, Heroku, DigitalOcean, etc.
        ;;
esac

# Run database migrations if needed
echo "🗃️ Running database migrations..."
if [[ -n "$MONGODB_URI" ]]; then
    # Add migration commands here
    echo "MongoDB migrations would run here"
fi

# Health check
echo "🏥 Running health checks..."
sleep 30  # Wait for deployment to be ready

HEALTH_URL="https://$ENVIRONMENT.novastream.app/api/health"
if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Performance check
echo "📊 Running performance check..."
if command -v lighthouse &> /dev/null; then
    lighthouse "https://$ENVIRONMENT.novastream.app" \
        --chrome-flags="--headless" \
        --output=json \
        --output-path=./lighthouse-report.json \
        --quiet
    
    # Check performance score
    PERF_SCORE=$(cat ./lighthouse-report.json | jq '.categories.performance.score * 100')
    if (( $(echo "$PERF_SCORE >= 80" | bc -l) )); then
        echo "✅ Performance check passed ($PERF_SCORE)"
    else
        echo "⚠️ Performance score below threshold ($PERF_SCORE)"
    fi
fi

echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
echo "🌐 Frontend URL: https://$ENVIRONMENT.novastream.app"
echo "🏗️ Backend URL: https://$ENVIRONMENT.novastream.app/api"