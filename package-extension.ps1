$ErrorActionPreference = 'Stop'
$project = $PSScriptRoot
node "$project\build-extension.mjs"
if ($LASTEXITCODE -ne 0) { throw 'Extension build failed' }
$manifest = Get-Content -LiteralPath "$project\extension\manifest.json" -Raw | ConvertFrom-Json
if ($manifest.manifest_version -ne 3) { throw 'Manifest V3 required' }
New-Item -ItemType Directory -Path "$project\public\downloads" -Force | Out-Null
Compress-Archive -Path "$project\extension\*" -DestinationPath "$project\public\downloads\vision-guard-extension.zip" -Force
Get-FileHash -LiteralPath "$project\public\downloads\vision-guard-extension.zip" -Algorithm SHA256
