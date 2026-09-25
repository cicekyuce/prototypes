$company = "OneDrive - Videotron Lt" + [char]0xE9 + "e"
$f = Join-Path $env:USERPROFILE (Join-Path $company "Desktop\Files\Devin\AI Story Writer\Output\Message Centre - Digital Experience Requirements.docx")

$FONT = "Ambra Sans"
$SIZE = 11
$STYLE_BULLET = -49  # wdStyleListBullet

function Find-Para($doc, $startsWith) {
  foreach ($p in $doc.Paragraphs) {
    $t = ($p.Range.Text -replace "[`r`a]", "").Trim()
    if ($t.StartsWith($startsWith)) { return $p }
  }
  return $null
}

function Set-ParaText($para, $text) {
  $r = $para.Range
  $r.MoveEnd(1, -1) | Out-Null   # exclude the paragraph mark
  $r.Text = $text
  $r.Font.Name = $FONT
  $r.Font.Size = $SIZE
}

function Add-BulletAfter($para, $text) {
  $para.Range.InsertParagraphAfter()
  $np = $para.Next()
  $np.Range.InsertBefore($text)
  $np.Style = $STYLE_BULLET
  $np.Range.Font.Name = $FONT
  $np.Range.Font.Size = $SIZE
  $np.Range.Font.Bold = $false
  return $np
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($f)

$log = @()

# 1. Summary under the document title
$sum1 = Find-Para $doc "This document outlines the experience and functional requirements for the Message Centre page"
if ($sum1) {
  Set-ParaText $sum1 "This document outlines the experience and functional requirements for the CRTC notifications experience in My Account. It covers the Message Centre page, the message preview screen and the message types displayed in it, and the notification preferences screens."
  $log += "updated summary paragraph 1"
} else { $log += "WARNING: summary paragraph 1 not found" }

$sum2 = Find-Para $doc "The requirements for the individual message types"
if ($sum2) {
  Set-ParaText $sum2 "Section 1 covers the Message Centre. Section 2 covers the message preview screen, including the requirements for each type of message displayed in it. Section 3 covers the notification preferences screens. Analytics and tracking requirements that apply across all of these sections are documented at the end."
  $log += "updated summary paragraph 2"
} else { $log += "WARNING: summary paragraph 2 not found" }

# 2. Pagination requirements in the Message List section
$tbc = Find-Para $doc "To be confirmed: the number of messages displayed before pagination"
if ($tbc) {
  Set-ParaText $tbc "To be confirmed: how long messages are retained before they are removed from the list."
  $log += "updated the to-be-confirmed bullet (pagination question now answered below)"

  $bullets = @(
    "A maximum of 10 messages is displayed per page.",
    "When more than 10 messages are available, pagination controls are displayed below the list.",
    "The pagination controls include a previous control, a next control and a page number for each page, with the current page clearly indicated.",
    "The previous control is disabled on the first page and the next control is disabled on the last page.",
    "Changing the search term or the filter returns the customer to the first page of results.",
    "When the customer opens a message and returns to the list, the page they were on is preserved, together with their search term and filter.",
    "When 10 or fewer messages are available, the pagination controls are not displayed."
  )
  $anchor = $tbc
  foreach ($b in $bullets) { $anchor = Add-BulletAfter $anchor $b }
  $log += "inserted " + $bullets.Count + " pagination bullets"
} else { $log += "WARNING: pagination anchor bullet not found" }

$doc.Save()
$doc.Close($false)
$word.Quit()

$log | ForEach-Object { " - " + $_ }
"Done."
