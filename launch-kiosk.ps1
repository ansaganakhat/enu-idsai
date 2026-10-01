$ErrorActionPreference = "Stop"

$edgeCandidates = @(
  "$env:ProgramFiles(x86)\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
)
$edge = $edgeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $edge) {
  Write-Host "Microsoft Edge табылмады / Microsoft Edge не найден." -ForegroundColor Red
  Read-Host "Enter"
  exit 1
}

$indexPath = (Resolve-Path (Join-Path $PSScriptRoot "index.html")).Path
$url = "file:///" + ($indexPath -replace '\\','/')

# Edge itself runs as a fullscreen kiosk. Therefore navigation to ENU and Platonus
# stays in kiosk/fullscreen mode even though those are external web sites.
$args = @(
  "--kiosk",
  $url,
  "--edge-kiosk-type=fullscreen",
  "--kiosk-printing",
  "--no-first-run",
  "--disable-pinch",
  "--overscroll-history-navigation=0",
  "--disable-features=Translate,TranslateUI"
)

Start-Process -FilePath $edge -ArgumentList $args
