# Load env vars from .env.local and start Go API
Get-Content ..\.env.local | ForEach-Object {
    if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
    $parts = $_ -split '=', 2
    if ($parts.Length -eq 2) {
        [System.Environment]::SetEnvironmentVariable($parts[0].Trim(), $parts[1].Trim(), 'Process')
    }
}
Write-Host "Starting Go API on port 8080..."
go run ./cmd/server
