#!/bin/bash

# Build script for NovaStream production deployment
set -e

echo "🚀 Starting NovaStream build process..."

# Environment setup
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out dist dist-server build_log.txt

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit --no-fund

# Run type checking
echo "🔍 Running TypeScript type check..."
npm run type-check

# Run linting
echo "🔧 Running ESLint..."
npm run lint

# Run unit tests with coverage
echo "🧪 Running unit tests..."
npm run test:coverage

# Build backend
echo "🏗️ Building backend..."
npm run build:server

# Build frontend
echo "🌐 Building frontend..."
npm run build

# Generate performance report
echo "📊 Generating performance report..."
if command -v npx &> /dev/null; then
  npx @next/bundle-analyzer@latest --out .next/analyze .next
fi

# Create build info
echo "📝 Creating build information..."
cat > build-info.json << EOF
{
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "commit": "${GITHUB_SHA:-$(git rev-parse HEAD)}",
  "branch": "${GITHUB_REF_NAME:-$(git rev-parse --abbrev-ref HEAD)}",
  "version": "$(node -p "require('./package.json').version")",
  "nodeVersion": "$(node -v)",
  "platform": "$(uname -s)",
  "architecture": "$(uname -m)"
}
EOF

echo "✅ Build completed successfully!"
echo "📁 Build artifacts:"
echo "   - Frontend: ./out/"
echo "   - Backend: ./dist-server/"
echo "   - Build info: ./build-info.json"