$ErrorActionPreference = 'Stop'

$repository = 'https://github.com/KaffuAlcaid/dsh-model-extensions'
$asset = 'DSH-Model-Extensions.zip'
$temporaryRoot = Join-Path ([IO.Path]::GetTempPath()) "dsh-model-extensions-$([Guid]::NewGuid().ToString('N'))"
$archive = Join-Path $temporaryRoot $asset
$extracted = Join-Path $temporaryRoot 'extracted'

New-Item -ItemType Directory -Path $temporaryRoot,$extracted -Force | Out-Null
try {
  Invoke-WebRequest -Uri "$repository/releases/latest/download/$asset" -OutFile $archive
  Expand-Archive -LiteralPath $archive -DestinationPath $extracted
  $installer = Get-ChildItem -LiteralPath $extracted -Filter install.ps1 -File -Recurse |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.Directory.FullName 'kit.json') -PathType Leaf } |
    Select-Object -First 1
  if ($null -eq $installer) {
    throw 'The downloaded release does not contain a plugin-kit installer.'
  }
  & $installer.FullName
  if ($LASTEXITCODE -ne 0) {
    throw "Plugin installation failed with exit code $LASTEXITCODE."
  }
} finally {
  $resolved = [IO.Path]::GetFullPath($temporaryRoot)
  $temp = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  if ($resolved.StartsWith($temp, [StringComparison]::OrdinalIgnoreCase) -and
      (Test-Path -LiteralPath $resolved)) {
    Remove-Item -LiteralPath $resolved -Recurse -Force
  }
}
