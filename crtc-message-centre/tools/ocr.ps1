param(
    [Parameter(Mandatory = $true)][string]$ImagePath,
    [int]$RowStep = 40,
    [double]$Scale = 2.0
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]

function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

Add-Type -AssemblyName System.Drawing
$bmp = [System.Drawing.Bitmap]::FromFile($ImagePath)
Write-Output ("=== " + (Split-Path $ImagePath -Leaf) + " | size " + $bmp.Width + "x" + $bmp.Height + " ===")

$xs = @(10, [int]($bmp.Width / 4), [int]($bmp.Width / 2), [int]($bmp.Width * 3 / 4), ($bmp.Width - 10))
$ys = @()
for ($y = 0; ($y -lt 120) -and ($y -lt $bmp.Height); $y += 10) { $ys += $y }
for ($y = 120; $y -lt $bmp.Height; $y += $RowStep) { $ys += $y }
foreach ($y in $ys) {
    $row = ""
    foreach ($x in $xs) {
        $c = $bmp.GetPixel($x, $y)
        $row += ("{0:X2}{1:X2}{2:X2} " -f $c.R, $c.G, $c.B)
    }
    Write-Output ("y=" + $y + "  " + $row)
}

try {
    $null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
    $null = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
    $null = [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime]
    $null = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]

    $newW = [int]($bmp.Width * $Scale)
    $newH = [int]($bmp.Height * $Scale)
    $upscaled = New-Object System.Drawing.Bitmap($newW, $newH)
    $g = [System.Drawing.Graphics]::FromImage($upscaled)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($bmp, 0, 0, $newW, $newH)
    $g.Dispose()
    $tempPath = Join-Path $env:TEMP ("ocr_" + [System.IO.Path]::GetFileNameWithoutExtension($ImagePath) + ".png")
    $upscaled.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $upscaled.Dispose()

    $storageFile = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($tempPath)) ([Windows.Storage.StorageFile])
    $stream = Await ($storageFile.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $ocrEngine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    $ocrResult = Await ($ocrEngine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

    Write-Output "--- OCR text (orig-image coords) ---"
    foreach ($line in $ocrResult.Lines) {
        $lineX = ($line.Words | ForEach-Object { $_.BoundingRect.X } | Measure-Object -Minimum).Minimum
        $lineY = ($line.Words | ForEach-Object { $_.BoundingRect.Y } | Measure-Object -Minimum).Minimum
        Write-Output ("y=" + [math]::Round($lineY / $Scale) + " x=" + [math]::Round($lineX / $Scale) + " | " + $line.Text)
    }
    Remove-Item $tempPath -ErrorAction SilentlyContinue
} catch {
    Write-Output ("OCR failed: " + $_.Exception.Message)
}
$bmp.Dispose()
