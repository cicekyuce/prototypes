$company = "OneDrive - Videotron Lt" + [char]0xE9 + "e"
$f = Join-Path $env:USERPROFILE (Join-Path $company "Desktop\Files\Devin\AI Story Writer\Output\Message Centre - Digital Experience Requirements.docx")

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($f, $false, $true)  # ReadOnly

"FILE: $f"
"NormalStyleFont: " + $doc.Styles.Item(-1).Font.Name + " / " + $doc.Styles.Item(-1).Font.Size
"---- PARAGRAPHS ----"
$i = 0
foreach ($p in $doc.Paragraphs) {
  $i++
  $txt = $p.Range.Text -replace "[`r`a]", ""
  if ($txt.Trim() -eq "") { "{0,3} | [EMPTY]" -f $i; continue }
  $styleName = $p.Style.NameLocal
  $fontName = $p.Range.Font.Name
  if (-not $fontName) { $fontName = "(mixed)" }
  $size = $p.Range.Font.Size
  $short = if ($txt.Length -gt 150) { $txt.Substring(0,150) + "..." } else { $txt }
  "{0,3} | {1} | {2} {3} | {4}" -f $i, $styleName, $fontName, $size, $short
}

$doc.Close($false)
$word.Quit()
