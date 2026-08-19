$ErrorActionPreference = 'Stop'

$kitRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$manifest = Get-Content -LiteralPath (Join-Path $kitRoot 'kit.json') -Raw -Encoding UTF8 | ConvertFrom-Json

$dshCommand = Get-Command dsh.cmd,dsh -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $dshCommand) {
  throw 'dsh was not found. Install the compatible @deepseek-ai/dsh version and make sure dsh is on PATH.'
}
if ($null -eq (Get-Command pnpm -ErrorAction SilentlyContinue)) {
  throw 'pnpm was not found. Run "corepack enable" and try again.'
}

$dshVersionOutput = (& $dshCommand --version 2>&1 | Out-String).Trim()
if ($LASTEXITCODE -ne 0) {
  throw 'Unable to determine the installed DSH version.'
}
$expectedDshVersion = [string]$manifest.dsh.version
$versionPattern = "(?<![0-9A-Za-z.-])v?$([Regex]::Escape($expectedDshVersion))(?![0-9A-Za-z.-])"
if ($dshVersionOutput -notmatch $versionPattern) {
  throw "This kit requires DSH $expectedDshVersion, but the installed command reported: $dshVersionOutput"
}

$userHome = [Environment]::GetFolderPath('UserProfile')
if ([string]::IsNullOrWhiteSpace($env:DSH_HOME)) {
  $dshHome = Join-Path $userHome '.dsh'
} elseif ($env:DSH_HOME -eq '~') {
  $dshHome = $userHome
} elseif ($env:DSH_HOME.StartsWith('~\') -or $env:DSH_HOME.StartsWith('~/')) {
  $dshHome = Join-Path $userHome $env:DSH_HOME.Substring(2)
} else {
  $dshHome = [IO.Path]::GetFullPath($env:DSH_HOME)
}

$cacheRoot = Join-Path $dshHome "plugin-cache\$($manifest.artifact)\$($manifest.version)"
New-Item -ItemType Directory -Path $cacheRoot -Force | Out-Null
$cachedPackages = @()
foreach ($package in $manifest.packages) {
  $source = Join-Path $kitRoot $package.file
  if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
    throw "Package not found: $source"
  }
  $destination = Join-Path $cacheRoot $package.file
  Copy-Item -LiteralPath $source -Destination $destination -Force
  $cachedPackages += $destination
}

& $dshCommand plugin --profile $manifest.profile add @cachedPackages
if ($LASTEXITCODE -ne 0) {
  throw "DSH plugin installation failed with exit code $LASTEXITCODE."
}
Write-Host "$($manifest.title) installed for DSH $($manifest.dsh.version)."
Write-Host 'The extracted kit directory can now be moved or deleted.'
