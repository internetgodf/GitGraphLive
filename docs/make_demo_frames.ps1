# Генератор кадров таймлапса для README: docs/demo.gif
# Рисует 16 кадров (пустой + 15 шагов «вырастания» графа) тем же алгоритмом и палитрой, что и расширение.
# NB: переменные именованы без конфликтов с PowerShell (case-insensitive: $c и $C — одна переменная!)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot          # docs -> корень репо
$framesDir = Join-Path $env:TEMP 'ggl_frames'
Remove-Item $framesDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $framesDir | Out-Null

$W = 480; $H = 440
$LANEW = 20; $ROWH = 26
function Cx([int]$laneId) { 16 + $laneId * $LANEW + 9 }
function Cy([int]$rowId)  { 26 + $rowId * $ROWH }
$LanColor = @{ 0 = '#58a6ff'; 1 = '#f778ba'; 2 = '#26a269' }
$BG = [System.Drawing.ColorTranslator]::FromHtml('#12161c')

# демо-данные (row — строка: 0 самый новый сверху … 14 самый старый снизу)
$Commits = @(
  @{ row = 14; lane = 0; msg = 'feat: initialize project';              who = 'Ann';  when = '2026-10-23'; parents = @() }
  @{ row = 13; lane = 1; msg = 'feat: product cards (branch catalog)';  who = 'Kate'; when = '2026-10-28'; parents = @(@{ p = 9; pl = 0 }) }
  @{ row = 12; lane = 2; msg = 'feat: login page (branch auth)';        who = 'Bob';  when = '2026-10-25'; parents = @(@{ p = 11; pl = 0 }) }
  @{ row = 11; lane = 0; msg = 'feat: landing page layout';             who = 'Ann';  when = '2026-10-24'; parents = @(@{ p = 14; pl = 0 }) }
  @{ row = 10; lane = 0; msg = 'style: dark theme';                     who = 'Ann';  when = '2026-10-26'; parents = @(@{ p = 11; pl = 0 }) }
  @{ row = 9;  lane = 0; msg = 'fix: button offset';                    who = 'Ann';  when = '2026-10-27'; parents = @(@{ p = 10; pl = 0 }) }
  @{ row = 8;  lane = 0; msg = 'fix: CORS errors';                      who = 'Ann';  when = '2026-10-29'; parents = @(@{ p = 9; pl = 0 }) }
  @{ row = 7;  lane = 0; msg = "Merge branch 'auth'";                   who = 'Kate'; when = '2026-10-30'; parents = @(@{ p = 8; pl = 0 }, @{ p = 12; pl = 2 }) }
  @{ row = 6;  lane = 0; msg = 'refactor: state storage';               who = 'Bob';  when = '2026-10-31'; parents = @(@{ p = 7; pl = 0 }) }
  @{ row = 5;  lane = 0; msg = 'feat: shopping cart';                   who = 'Kate'; when = '2026-11-01'; parents = @(@{ p = 6; pl = 0 }) }
  @{ row = 4;  lane = 0; msg = "Merge branch 'catalog'";                who = 'Ann';  when = '2026-11-02'; parents = @(@{ p = 5; pl = 0 }, @{ p = 13; pl = 1 }) }
  @{ row = 3;  lane = 0; msg = 'docs: README';                          who = 'Ann';  when = '2026-11-03'; parents = @(@{ p = 4; pl = 0 }) }
  @{ row = 2;  lane = 0; msg = 'fix: memory leak in chat';              who = 'Bob';  when = '2026-11-04'; parents = @(@{ p = 3; pl = 0 }) }
  @{ row = 1;  lane = 0; msg = 'chore: bump dependencies';              who = 'Ann';  when = '2026-11-05'; parents = @(@{ p = 2; pl = 0 }) }
  @{ row = 0;  lane = 0; msg = 'feat: dark cart theme';                 who = 'Ann';  when = '2026-11-06'; parents = @(@{ p = 1; pl = 0 }) }
)

$fontMsg = New-Object System.Drawing.Font ('Segoe UI', 13, [System.Drawing.GraphicsUnit]::Pixel)
$fontMeta = New-Object System.Drawing.Font ('Segoe UI', 11, [System.Drawing.GraphicsUnit]::Pixel)
$brushMsg = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#d0d7de'))
$brushMeta = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#8b949e'))
$brushTitle = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#58a6ff'))

function New-Brush([string]$hex) { New-Object System.Drawing.SolidBrush -ArgumentList ([System.Drawing.ColorTranslator]::FromHtml($hex)) }
function New-Pen([string]$hex, [float]$w) { New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.ColorTranslator]::FromHtml($hex)), $w }

function Draw-Frame([int]$step) {
  # step: 0 = пустой граф, 1..15 = раскрыты строки row >= 15-step
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAlias'
  $g.Clear($BG)
  $g.DrawString('GitGraph Live - demo', $fontMsg, $brushTitle, 14, 6)

  $minRow = 15 - $step

  # рёбра (рисуются, когда открыт их родитель-ребёнок)
  foreach ($edgeOwner in $Commits) {
    if ($edgeOwner.row -lt $minRow) { continue }
    $pen = New-Pen $LanColor[[int]$edgeOwner.lane] 2
    if ($edgeOwner.parents.Count -eq 0) {
      $g.DrawLine($pen, (Cx $edgeOwner.lane), (Cy $edgeOwner.row), (Cx $edgeOwner.lane), ([float]((Cy $edgeOwner.row) + 10)))
    }
    foreach ($par in $edgeOwner.parents) {
      $x1 = Cx $edgeOwner.lane;  $y1 = Cy $edgeOwner.row
      $x2 = Cx $par.pl; $y2 = Cy $par.p
      if ($x1 -eq $x2) {
        $g.DrawLine($pen, $x1, $y1, (Cx $par.pl), (Cy $par.p))
      } else {
        $k = [Math]::Min(14, [Math]::Max(6, ($y2 - $y1) / 3))
        $g.DrawBezier($pen, $x1, $y1, $x1, ($y1 + $k), $x2, ($y2 - $k), $x2, $y2)
      }
    }
  }

  # точки + подписи
  foreach ($node in $Commits) {
    if ($node.row -lt $minRow) { continue }
    $x = Cx $node.lane; $y = Cy $node.row
    $dotBrush = New-Brush $LanColor[[int]$node.lane]
    $strokePen = New-Pen '#12161c' 2
    $g.FillEllipse($dotBrush, $x - 5, $y - 5, 10, 10)
    $g.DrawEllipse($strokePen, $x - 5, $y - 5, 10, 10)
    $msgW = [int]$g.MeasureString($node.msg, $fontMsg).Width
    $g.DrawString($node.msg, $fontMsg, $brushMsg, 90, ($y - 13))
    $g.DrawString(('{0} | {1}' -f $node.who, $node.when), $fontMeta, $brushMeta, (90 + $msgW + 8), ($y - 12))
  }

  $g.Dispose()
  return $bmp
}

for ($frame = 0; $frame -le 15; $frame++) {
  $bmp = Draw-Frame $frame
  $bmp.Save((Join-Path $framesDir ('frame_{0:d2}.png' -f $frame)), [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
Write-Host "frames: 16 generated at $framesDir"
