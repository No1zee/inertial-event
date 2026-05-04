# NovaStream Process Nuke Script (Windows PowerShell)
# This script aggressively terminates all processes associated with the NovaStream (MaiWatch) development environment
# to prevent system slowdown and "ghost" PIDs.

$Ports = @(3000, 5000)
$ProcessNames = @("electron", "next-render-worker", "tsx")

Write-Host "--- NovaStream Cleanup Sequence Initiated ---" -ForegroundColor Cyan

# 1. Kill Node processes specifically within this directory
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*nova_v2*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Kill specified process names
foreach ($name in $ProcessNames) {
    Stop-Process -Name $name -Force -ErrorAction SilentlyContinue
}

# 3. Aggressive port cleanup (terminates whatever is holding our dev ports)
foreach ($port in $Ports) {
    $pidToKill = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($pidToKill) {
        Write-Host "Terminating process $pidToKill holding port $port..." -ForegroundColor Yellow
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "--- Cleanup Complete. System should be breathing now. ---" -ForegroundColor Cyan
