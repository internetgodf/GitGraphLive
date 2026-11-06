Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'
$icons = Split-Path -Parent $MyInvocation.MyCommand.Path

function New-Dot([System.Drawing.Graphics]$g, [float]$x, [float]$y, [float]$r, [string]$fillHex) {
  $b = New-Object System.Drawing.SolidBrush -ArgumentList ([System.Drawing.ColorTranslator]::FromHtml($fillHex))
  $g.FillEllipse($b, [float]($x - $r), [float]($y - $r), [float]($r * 2), [float]($r * 2))
  $p = New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.ColorTranslator]::FromHtml('#161b22')), ([float](0.35 * $r))
  $g.DrawEllipse($p, [float]($x - $r), [float]($y - $r), [float]($r * 2), [float]($r * 2))
}

function New-Icon([int]$s, [string]$out) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::Transparent)

  # округлённый тёмный фон
  $rad = $s * 0.22
  $gp = New-Object System.Drawing.Drawing2D.GraphicsPath
  $gp.AddArc(0, 0, $rad * 2, $rad * 2, 180, 90)
  $gp.AddArc($s - $rad * 2, 0, $rad * 2, $rad * 2, 270, 90)
  $gp.AddArc($s - $rad * 2, $s - $rad * 2, $rad * 2, $rad * 2, 0, 90)
  $gp.AddArc(0, $s - $rad * 2, $rad * 2, $rad * 2, 90, 90)
  $gp.CloseFigure()
  $bgBrush = New-Object System.Drawing.SolidBrush -ArgumentList ([System.Drawing.ColorTranslator]::FromHtml('#161b22'))
  $g.FillPath($bgBrush, $gp)

  # ствол (синяя вертикаль)
  $w = [Math]::Max(1.0, [Math]::Round($s * 0.06, 2))
  $trunkPen = New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.ColorTranslator]::FromHtml('#58a6ff')), ([float]$w)
  $tx = 0.30 * $s
  $g.DrawLine($trunkPen, [float]$tx, [float](0.14 * $s), [float]$tx, [float](0.88 * $s))

  # merge-дуга (зелёная ветка, вливающаяся в ствол)
  $branchPen = New-Object System.Drawing.Pen -ArgumentList ([System.Drawing.ColorTranslator]::FromHtml('#26a269')), ([float]$w)
  $g.DrawBezier($branchPen, [float]$tx, [float](0.18 * $s), [float]$tx, [float](0.34 * $s), [float]($s * 0.72), [float](0.30 * $s), [float]($s * 0.72), [float](0.52 * $s))
  $g.DrawLine($branchPen, [float]($s * 0.72), [float](0.52 * $s), [float]$tx, [float](0.74 * $s))

  # точки-коммиты
  $r = $s * 0.09
  New-Dot $g ([float]$tx) ([float](0.30 * $s)) ([float]$r) '#58a6ff'
  New-Dot $g ([float]$tx) ([float](0.74 * $s)) ([float]$r) '#58a6ff'
  New-Dot $g ([float]($s * 0.72)) ([float](0.52 * $s)) ([float]$r) '#26a269'

  $g.Dispose()
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

foreach ($sz in 16, 32, 48, 128) {
  New-Icon -s $sz -out (Join-Path $icons "icon$sz.png")
}
Write-Host "icons generated: 16/32/48/128"
