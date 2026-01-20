@echo off
set "PATH=%PATH%;C:\Program Files (x86)\WiX Toolset v3.14\bin;C:\Program Files\dotnet"

echo [1/3] Building Custom Action (InstallerHelper)...
dotnet publish installer\InstallerHelper\InstallerHelper.csproj -c Release -r win-x64
if %errorlevel% neq 0 (
    echo [ERROR] Dotnet publish failed with code %errorlevel%
    exit /b %errorlevel%
)

echo [2/3] Verifying Binaries...
if not exist "dist\win-unpacked\NovaStream.exe" (
    echo [ERROR] NovaStream.exe is missing. Run 'npm run electron-build' first.
    exit /b 1
)

echo [3/3] Compiling WiX Installer...
cd installer
candle.exe Product.wxs -arch x64
if %errorlevel% neq 0 (
    echo [ERROR] Candle failed.
    exit /b %errorlevel%
)

light.exe Product.wixobj -out NovaStream_Setup.msi -ext WixUIExtension
if %errorlevel% neq 0 (
    echo [ERROR] Light failed.
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] Installer created at installer\NovaStream_Setup.msi
pause
