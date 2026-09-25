$company = "OneDrive - Videotron Lt" + [char]0xE9 + "e"
$f = Join-Path $env:USERPROFILE (Join-Path $company "Desktop\Files\Devin\AI Story Writer\Output\Message Centre - Digital Experience Requirements.docx")

$FONT = "Ambra Sans"
$SIZE = 11
$ST = @{ H1 = -2; Normal = -1; B = -49; N = -29 }

$content = @(
  @{ s = "H1"; t = "2. Message Preview Screen" },
  @{ s = "Normal"; t = "The message preview screen displays the content of the message the customer selects in the Message Centre. The screen frame, the back link, the message header, the sign-off and the confirmation of where the message was sent are covered in section 1.8. The requirements below cover the content displayed inside the screen." },
  @{ s = "Normal"; t = "Messages delivered as a PDF do not use this screen; they open in a new browser tab as described in section 1.7." },

  @{ s = "H1"; t = "2.1. Message Types" },
  @{ s = "B"; t = "Three kinds of messages are displayed in the message preview screen:" },
  @{ s = "N"; t = "Regulatory message: contains regulatory content only." },
  @{ s = "N"; t = "Marketing offer message: contains one or more marketing offers only." },
  @{ s = "N"; t = "Hybrid message: contains both regulatory content and one or more marketing offers in the same message." },
  @{ s = "B"; t = "The message type is provided by the backend and must not be inferred in the front end." },
  @{ s = "B"; t = "The message type determines which sections are displayed; all other elements of the screen are the same for all three kinds." },
  @{ s = "B"; t = "In a hybrid message, the regulatory content is always displayed first, followed by the marketing offer section, with a clear visual separation between the two." },

  @{ s = "H1"; t = "2.2. Regulatory Content" },
  @{ s = "B"; t = "Regulatory content is retrieved from Sonic. The content is owned by Sonic and cannot be edited in Contentful or modified in My Account." },
  @{ s = "B"; t = "For this reason, no requirements for the regulatory copy itself are defined in this document." },
  @{ s = "B"; t = "The content must be displayed in full, exactly as it is received from Sonic, without truncation." },
  @{ s = "B"; t = "The regulatory section displays the elements provided by Sonic, which may include a title, an effective date, body copy, a list of affected items and a footnote." },

  @{ s = "H1"; t = "2.3. Marketing Offer Content" },
  @{ s = "B"; t = "Marketing offers are retrieved from Salesforce Marketing Cloud." },
  @{ s = "B"; t = "The offers a customer is eligible for are determined by the Tealium audiences the customer belongs to." },
  @{ s = "B"; t = "Only the offers available for that specific customer are displayed, both in a marketing offer message and in the marketing offer section of a hybrid message." },
  @{ s = "B"; t = "When no offer is available for the customer, the marketing offer section is not displayed." },
  @{ s = "B"; t = "Each offer is displayed as a card containing:" },
  @{ s = "N"; t = "A short label identifying the offer, for example New offer" },
  @{ s = "N"; t = "A headline" },
  @{ s = "N"; t = "A description" },
  @{ s = "N"; t = "A call to action with its destination URL" },
  @{ s = "N"; t = "An optional image" },
  @{ s = "B"; t = "The content of the card, the call to action label and the destination URL are provided with the offer by Salesforce Marketing Cloud." },
  @{ s = "B"; t = "To be confirmed: whether the marketing offer section is suppressed for customers who have opted out of marketing communications in their notification preferences." },

  @{ s = "H1"; t = "2.4. Multiple Offers" },
  @{ s = "B"; t = "When more than one offer is available for the customer, the offers are displayed in a carousel within the marketing offer section." },
  @{ s = "B"; t = "The carousel displays one offer at a time and includes:" },
  @{ s = "N"; t = "A heading showing the number of offers available" },
  @{ s = "N"; t = "Previous and next controls" },
  @{ s = "N"; t = "A counter showing the position of the offer displayed, for example 1 of 3" },
  @{ s = "N"; t = "One dot for each offer, with the current offer clearly indicated" },
  @{ s = "B"; t = "Selecting a dot displays the corresponding offer directly." },
  @{ s = "B"; t = "Navigation wraps around: selecting next on the last offer returns to the first offer, and selecting previous on the first offer moves to the last." },
  @{ s = "B"; t = "When only one offer is available, it is displayed as a single card without carousel controls." },
  @{ s = "B"; t = "To be confirmed: the maximum number of offers that can be displayed in a single message." },

  @{ s = "H1"; t = "2.5. Error Handling" },
  @{ s = "B"; t = "If the message content cannot be retrieved, an error message is displayed and the customer is able to return to the Message Centre." },
  @{ s = "B"; t = "If the regulatory content is retrieved but the offers are not available, the regulatory content is still displayed and the marketing offer section is omitted." },
  @{ s = "B"; t = "All error messages must be editable in Contentful." }
)

function Find-Para($doc, $startsWith) {
  foreach ($p in $doc.Paragraphs) {
    $t = ($p.Range.Text -replace "[`r`a]", "").Trim()
    if ($t.StartsWith($startsWith)) { return $p }
  }
  return $null
}

function Add-ParaAfter($para, $text, $styleId) {
  $para.Range.InsertParagraphAfter()
  $np = $para.Next()
  $np.Range.InsertBefore($text)
  $np.Style = $styleId
  $np.Range.Font.Name = $FONT
  $np.Range.Font.Size = $SIZE
  return $np
}

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($f)

# Anchor: last bullet of section 1.10 Error Handling, immediately before the Analytics heading
$anchor = Find-Para $doc "All error messages must be editable in Contentful."
if (-not $anchor) { $doc.Close($false); $word.Quit(); throw "Anchor paragraph not found - document not modified." }

$added = 0
foreach ($item in $content) {
  $anchor = Add-ParaAfter $anchor $item.t $ST[$item.s]
  $added++
}

$doc.Save()
$doc.Close($false)
$word.Quit()

"Inserted $added paragraphs for Section 2 before the Analytics section."
