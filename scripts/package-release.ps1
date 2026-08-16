$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$kitRoot = Join-Path $projectRoot 'release\plugin-kits'
& node (Join-Path $PSScriptRoot 'build-packages.mjs')
if ($LASTEXITCODE -ne 0) {
  throw "Plugin build failed with exit code $LASTEXITCODE."
}

Get-ChildItem -LiteralPath $kitRoot -Directory | ForEach-Object {
  $archive = Join-Path $projectRoot "release\$($_.Name).zip"
  if (Test-Path -LiteralPath $archive) {
    Remove-Item -LiteralPath $archive -Force
  }
  Compress-Archive -LiteralPath $_.FullName -DestinationPath $archive -CompressionLevel Optimal
}
Write-Host "Plugin release archives written to $(Join-Path $projectRoot 'release')"
