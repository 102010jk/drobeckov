# Starts a fresh Codex session that keeps playing Drobečkov (the town is saved in the game).
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
$codex = "$env:LOCALAPPDATA\Programs\OpenAI\Codex\bin\codex.exe"
if (-not (Test-Path $codex)) { $codex = 'codex' }
$prompt = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'codex-prompt.txt')
Set-Location 'C:\Crumbvale'
& $codex $prompt
