@echo off
REM Load env vars from .env.local and start Go API

setlocal EnableDelayedExpansion
for /f "usebackq eol=# delims=" %%L in ("..\.env.local") do (
    set "line=%%L"
    if not "!line!"=="" (
        for /f "tokens=1 delims==" %%K in ("!line!") do (
            set "key=%%K"
            set "val=!line:*%%K=!"
            set "val=!val:~1!"
            if not "!val!"=="" endlocal & set "%%K=!val!" & setlocal EnableDelayedExpansion
        )
    )
)
endlocal

echo Starting Go API on port 8080...
go run ./cmd/server
