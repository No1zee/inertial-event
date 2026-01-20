@echo on
REM Debug Build Script

REM 1. Setup Environment
set "PATH=%PATH%;C:\Program Files (x86)\WiX Toolset v3.14\bin;C:\Program Files\dotnet"
echo PATH set.

REM 2. Check Tools
echo Checking Dotnet...
dotnet --version
if %errorlevel% neq 0 goto Fail

REM 3. Build Helper
echo Building InstallerHelper from %CD%...
REM dotnet publish installer\InstallerHelper\InstallerHelper.csproj -c Release -r win-x64
REM if %errorlevel% neq 0 (
REM     echo [ERROR] Dotnet publish failed with code %errorlevel%
REM     goto Fail
REM )

REM 4. Verify Helper Output
echo Verifying Helper Binary...
if not exist "installer\InstallerHelper\bin\Release\net8.0\win-x64\publish\InstallerHelper.exe" (
    echo [ERROR] InstallerHelper.exe not found at expected path!
    dir "installer\InstallerHelper\bin\Release\net8.0\win-x64" /s
    goto Fail
)

REM 5. Verify App Mock
echo Verifying App Binary...
if not exist "dist\win-unpacked\NovaStream.exe" (
    echo [ERROR] NovaStream.exe not found at dist\win-unpacked\NovaStream.exe
    goto Fail
)

REM 6. WiX Compile
echo Running Candle...
cd installer
candle.exe Product.wxs -arch x64 -v > candle.log 2>&1
set BUILD_ERR=%errorlevel%
type candle.log
if %BUILD_ERR% neq 0 (
    echo [ERROR] Candle failed.
    exit /b 1
)

REM 7. WiX Link
echo Running Light...
light.exe Product.wixobj -out NovaStream_Setup.msi -ext WixUIExtension -v > light.log 2>&1
set BUILD_ERR=%errorlevel%
type light.log
if %BUILD_ERR% neq 0 (
    echo [ERROR] Light failed.
    exit /b 1
)

echo [SUCCESS] Build Complete.
exit /b 0

:Fail
echo [FAILED] Build failed.
exit /b 1
