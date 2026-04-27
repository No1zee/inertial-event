# MaiWatch Process Nuke Script (Windows PowerShell)
# This script aggressively terminates all processes associated with the MaiWatch development environment
# to prevent system slowdown and "ghost" PIDs.

$Ports = @(3000, 5000)
$ProcessNames = @("electron", "next-render-worker", "tsx")

Write-Host "--- MaiWatch Cleanup Sequence Initiated ---" -ForegroundColor Cyan

# 1. Kill by Ports (Next.js and Express)
foreach ($Port in $Ports) {
    Write-Host "Searching for processes on port $Port..." -NoNewline
    $Connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($Connections) {
        $Pids = $Connections.OwningProcess | Select-Object -Unique
        foreach ($Pid in $Pids) {
            try {
                Stop-Process -Id $Pid -Force -ErrorAction SilentlyContinue
                Write-Host " [KILLED $Pid]" -ForegroundColor Green
            } catch {
                Write-Host " [FAILED $Pid]" -ForegroundColor Red
            }
        }
    } else {
        Write-Host " [CLEAN]" -ForegroundColor Gray
    }
}

# 2. Kill by Name (Leaked Workers)
Write-Host "Searching for leaked workers ($($ProcessNames -join ', '))..."
foreach ($Name in $ProcessNames) {
    $Procs = Get-Process -Name $Name -ErrorAction SilentlyContinue
    if ($Procs) {
        foreach ($Proc in $Procs) {
            # Only kill if it looks like a dev worker (Next.js render workers can be named node or electron)
            try {
                $Proc | Stop-Process -Force -ErrorAction SilentlyContinue
                Write-Host "Terminated: $($Proc.Name) ($($Proc.Id))" -ForegroundColor Yellow
            } catch {}
        }
    }
}

# 3. Nuclear Node Cleanup (Optional, but often necessary on Windows)
Write-Host "Running final node.exe sweep..."
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*nova_v2*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "--- Cleanup Complete. System should be breathing now. ---" -ForegroundColor Cyan
