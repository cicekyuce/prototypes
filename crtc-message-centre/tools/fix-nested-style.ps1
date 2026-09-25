$company = "OneDrive - Videotron Lt" + [char]0xE9 + "e"
$f = Join-Path $env:USERPROFILE (Join-Path $company "Desktop\Files\Devin\AI Story Writer\Output\Message Centre - Digital Experience Requirements.docx")

$FONT = "Ambra Sans"
$SIZE = 11
$LIST_NUMBER = -50  # wdStyleListNumber

$targets = @(
  "Regulatory message: contains regulatory content only.",
  "Marketing offer message: contains one or more marketing offers only.",
  "Hybrid message: contains both regulatory content and one or more marketing offers in the same message.",
  "A short label identifying the offer, for example New offer",
  "A headline",
  "A description",
  "A call to action with its destination URL",
  "An optional image",
  "A heading showing the number of offers available",
  "Previous and next controls",
  "A counter showing the position of the offer displayed, for example 1 of 3",
  "One dot for each offer, with the current offer clearly indicated"
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($f)

$fixed = 0
foreach ($p in $doc.Paragraphs) {
  $t = ($p.Range.Text -replace "[`r`a]", "").Trim()
  if ($targets -contains $t -and $p.Style.NameLocal -ne "List Number") {
    $p.Style = $LIST_NUMBER
    $p.Range.Font.Name = $FONT
    $p.Range.Font.Size = $SIZE
    $fixed++
  }
}

$doc.Save()
$doc.Close($false)
$word.Quit()

"Restyled $fixed nested items to List Number."
