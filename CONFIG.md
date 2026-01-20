# NovaStream Configuration Guide

## Required Environment Variables

### Main Application (.env)

```env
# TMDB API (Required)
NEXT_PUBLIC_TMDB_API_KEY=0e32674bae6ecae7dcbf20a4e47790a7
TMDB_API_KEY=0e32674bae6ecae7dcbf20a4e47790a7
# OpenSubtitles (Required for subtitles)
NEXT_PUBLIC_OPENSUBTITLES_KEY=your_opensubtitles_key_here

# Keygen Server
KEYGEN_SERVER_URL=/api/keygen

# MongoDB (for production backend)
MONGODB_URI=mongodb+srv://dbUser:<db_password>@cluster0.spqnpie.mongodb.net/?appName=Cluster0

# App Security
NOVA_STREAM_SALT=NOVA_STREAM_SECURE_SALT_2026-X892
```

### Keygen Server (keygen-server/.env)

```env
PORT=4000

# Security Keys (CHANGE THESE IN PRODUCTION!)
MASTER_KEY=Tinotenda123
JWT_SECRET=Tinotenda123

# Environment
NODE_ENV=development

# MongoDB Connection (REQUIRED)
MONGODB_URI=mongodb+srv://dbUser:<db_password>@cluster0.spqnpie.mongodb.net/?appName=Cluster0
```

## How to Get API Keys

### TMDB API Key
1. Go to https://www.themoviedb.org/
2. Create an account
3. Go to Settings → API
4. Request an API key (choose "Developer" option)
5. Copy the API Key (v3 auth)

### OpenSubtitles API Key
1. Go to https://www.opensubtitles.com/
2. Create an account
3. Go to https://www.opensubtitles.com/en/consumers
4. Request API access
5. Copy your API key

### MongoDB Atlas (Free Tier)
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free account
3. Create a new cluster (M0 Sandbox - FREE)
4. Click "Connect" → "Connect your application"
5. Copy the connection string
6. Replace `<username>` and `<password>` with your database credentials

## Generate Secure Keys

For `MASTER_KEY` and `JWT_SECRET`, use PowerShell:

```powershell
# Generate secure random strings
-join ((48..57) + (97..122) + (65..90) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

Run this twice to get two different keys.

## Build Commands

### Build Keygen Admin Dashboard
```powershell
cd keygen-server\admin-dashboard
npm install
npm run build
```

### Build Windows App
```powershell
# From project root
npm run encrypt-env    # Encrypt environment variables
npm run build:server   # Build backend bundle
npm run electron-build # Build complete Windows installer
```

## Testing

### Test Keygen Server
```powershell
cd keygen-server
npm start
# Visit http://localhost:4000
```

### Test Electron App (Dev Mode)
```powershell
npm run electron-dev
```

### Generate Test License
Use the admin dashboard at `http://localhost:4000` or use curl:

```powershell
$headers = @{
    "X-Admin-Key" = "your_master_key_here"
    "Content-Type" = "application/json"
}

$body = @{
    user_email = "test@example.com"
    access_type = "permanent"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:4000/api/admin/generate-key" -Method POST -Headers $headers -Body $body
```
