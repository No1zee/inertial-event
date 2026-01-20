$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Build & Deploy Sequence..." -ForegroundColor Green

# 1. Build Next.js
Write-Host "`n📦 Building Next.js App..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1 
}

# 2. Sync Capacitor
Write-Host "`n🔄 Syncing Capacitor..." -ForegroundColor Cyan
npx cap sync
if ($LASTEXITCODE -ne 0) { 
    Write-Host "❌ Capacitor Sync failed!" -ForegroundColor Red
    exit 1 
}

# 3. Deploy to TV
$Target = "192.168.100.5:5555"
Write-Host "`n📺 Deploying to TV ($Target)..." -ForegroundColor Cyan
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "C:\Program Files\Android\Android Studio\jbr\bin;$env:Path;C:\Users\Edward Magejo\AppData\Local\Android\Sdk\platform-tools"

npx cap run android --target $Target

Write-Host "`n✅ Deployment process finished." -ForegroundColor Green
