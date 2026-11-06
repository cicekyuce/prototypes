param(
  [string]$OutPath = ""
)

if (-not $OutPath) {
  # Build the accented folder name from a char code so the path is not affected by script file encoding
  $company = "OneDrive - Videotron Lt" + [char]0xE9 + "e"
  $OutPath = Join-Path $env:USERPROFILE (Join-Path $company "Desktop\Files\Devin\AI Story Writer\Output\Message Centre - Digital Experience Requirements.docx")
}

# Locale-safe WdBuiltinStyle constants
$S = @{
  Title    = -63
  Subtitle = -75
  H1       = -2
  H2       = -3
  Normal   = -1
  B1       = -49
  B2       = -50
  B3       = -51
}

$content = @(
  @{ s = "Title";    t = "Message Centre - My Account" },
  @{ s = "Subtitle"; t = "Digital Experience Requirements Document" },

  @{ s = "Normal"; t = "This document outlines the experience and functional requirements for the Message Centre page in My Account. The Message Centre gives customers a single place to view notifications related to their account, including regulatory notices that we are required to send and optional marketing offers." },
  @{ s = "Normal"; t = "The requirements for the individual message types and their content templates (regulatory notices, marketing offers, and messages that combine both) will be provided in a separate document." },
  @{ s = "Normal"; t = "Prototype reference: [add link]" },
  @{ s = "Normal"; t = "Figma design file: [add link]" },

  @{ s = "H1"; t = "1. Entry Points and Navigation" },
  @{ s = "B1"; t = "The Message Centre is accessible from My Profile through a list item showing the page name and a short description." },
  @{ s = "B1"; t = "The page must have its own URL so it can be linked to directly from emails, SMS messages, push notifications and other channels." },
  @{ s = "B1"; t = "Selecting a message opens the message detail view; a back link returns the customer to the message list." },
  @{ s = "B1"; t = "When the customer returns to the list, any search term and filter they had applied must be preserved." },

  @{ s = "H1"; t = "2. Message List" },
  @{ s = "B1"; t = "The list displays all messages available for the account, sorted with the most recent message first." },
  @{ s = "B1"; t = "Each row displays three pieces of information:" },
  @{ s = "B2"; t = "Received date" },
  @{ s = "B2"; t = "Subject" },
  @{ s = "B2"; t = "Message type" },
  @{ s = "B1"; t = "Column headers must be editable in Contentful." },
  @{ s = "B1"; t = "The entire row is clickable, not only the subject text." },
  @{ s = "B1"; t = "Message data (date, subject, type, format and content) is retrieved from the backend." },
  @{ s = "B1"; t = "To be confirmed: the number of messages displayed before pagination or lazy loading is applied, and how long messages are retained before they are removed from the list." },

  @{ s = "H1"; t = "3. Read and Unread Behaviour" },
  @{ s = "B1"; t = "Unread messages are visually distinguished from read messages using both an indicator and emphasized subject text, so that colour alone is not the only indicator." },
  @{ s = "B1"; t = "Opening a message marks it as read immediately." },
  @{ s = "B1"; t = "The read or unread state is stored in the backend and must persist across sessions, browsers and devices." },
  @{ s = "B1"; t = "To be confirmed: whether an unread message count is also surfaced in the account navigation." },

  @{ s = "H1"; t = "4. Search" },
  @{ s = "B1"; t = "A search field is available above the list, with editable placeholder text." },
  @{ s = "B1"; t = "Results filter as the customer types." },
  @{ s = "B1"; t = "The search must match against the subject, the message type, the received date and the content of the message." },
  @{ s = "B1"; t = "When multiple words are entered, all words must match for a message to be displayed." },
  @{ s = "B1"; t = "Search is not case sensitive." },
  @{ s = "B1"; t = "Clearing the field restores the full list." },

  @{ s = "H1"; t = "5. Filter by Message Type" },
  @{ s = "B1"; t = "A filter control is available above the list, defaulting to all message types." },
  @{ s = "B1"; t = "The filter menu includes:" },
  @{ s = "B2"; t = "All types" },
  @{ s = "B2"; t = "Read and Unread" },
  @{ s = "B2"; t = "One entry for each message type, for example Activation, Contract expiry, Offer, Plan change, Promotion expiry, Regulatory and Roaming" },
  @{ s = "B1"; t = "The list of message types must be driven by the types returned by the backend rather than hard-coded in the front end, so that new types can be introduced without a code change." },
  @{ s = "B1"; t = "The currently selected value is displayed on the filter control." },
  @{ s = "B1"; t = "The menu closes when an option is selected, when the customer clicks outside of it, and when the Escape key is pressed." },
  @{ s = "B1"; t = "Search and filter work together; applying both narrows the list further." },
  @{ s = "B1"; t = "All filter labels must be editable in Contentful." },

  @{ s = "H1"; t = "6. Empty States" },
  @{ s = "B1"; t = "When a search or filter returns no results, an empty state message is displayed in place of the list." },
  @{ s = "B1"; t = "When the account has no messages at all, a separate empty state message is displayed." },
  @{ s = "B1"; t = "Both messages must be editable in Contentful." },

  @{ s = "H1"; t = "7. Opening a Message" },
  @{ s = "B1"; t = "Messages are delivered in one of two formats, indicated by the backend:" },
  @{ s = "B2"; t = "In-app message: opens in the message detail view within My Account, in the same browser tab." },
  @{ s = "B2"; t = "PDF document: opens in a new browser tab." },
  @{ s = "B1"; t = "Rows that open a PDF must display an icon indicating that the message opens in a new tab." },
  @{ s = "B1"; t = "The icon must include a tooltip and an accessible label stating that the message opens in a new tab as a PDF." },

  @{ s = "H1"; t = "8. Message Detail View" },
  @{ s = "B1"; t = "The detail view includes a back link to the Message Centre." },
  @{ s = "B1"; t = "A header area displays the message category label and the date and time the message was received." },
  @{ s = "B1"; t = "Below the content, the page displays a closing sign-off and a line confirming where the message was sent, showing the customer's email address or mobile number with an icon reflecting the channel used." },
  @{ s = "B1"; t = "The sign-off and the sent-to label must be editable in Contentful; the address, mobile number and channel are retrieved from the backend." },
  @{ s = "B1"; t = "The content blocks used inside the detail view, and the rules for each message type, are documented separately." },

  @{ s = "H1"; t = "9. Content Management" },
  @{ s = "B1"; t = "All static copy on the page must be editable in Contentful, including the page title and subtitle, column headers, search placeholder, filter labels, empty state messages, sign-off and sent-to label." },
  @{ s = "B1"; t = "All customer-specific values are retrieved from the backend and must not be hard-coded." },
  @{ s = "B1"; t = "The page must be fully available in English and French." },

  @{ s = "H1"; t = "10. Responsive Behaviour" },
  @{ s = "B1"; t = "On desktop, messages are displayed in a three-column layout." },
  @{ s = "B1"; t = "On mobile, the row content stacks while keeping the received date, subject and type visible." },
  @{ s = "B1"; t = "Search and filter controls remain available and usable at all breakpoints." },

  @{ s = "H1"; t = "11. Accessibility" },
  @{ s = "B1"; t = "The page must meet WCAG 2.1 Level AA." },
  @{ s = "B1"; t = "All interactive elements, including message rows, the search field and the filter menu, must be operable by keyboard and display a visible focus state." },
  @{ s = "B1"; t = "The unread state must be communicated to screen readers, not conveyed by colour alone." },
  @{ s = "B1"; t = "Links that open a new tab must announce this behaviour to screen reader users." },
  @{ s = "B1"; t = "The message list must use semantic list and heading structure." },

  @{ s = "H1"; t = "12. Error Handling" },
  @{ s = "B1"; t = "If the message service fails or does not respond, an error state with the option to retry is displayed. The no-messages empty state must not be shown in this situation." },
  @{ s = "B1"; t = "If an individual PDF cannot be retrieved, an error message is displayed and the customer remains in the Message Centre." },
  @{ s = "B1"; t = "If only part of the message list can be retrieved, the available messages are displayed." },
  @{ s = "B1"; t = "All error messages must be editable in Contentful." },

  @{ s = "H1"; t = "13. Analytics and Tracking" },
  @{ s = "Normal"; t = "At a minimum, the following data points should be captured:" },
  @{ s = "B1"; t = "Page views of the Message Centre, including the entry point used to reach it." },
  @{ s = "B1"; t = "Message opens, captured by message type and delivery format (in-app or PDF)." },
  @{ s = "B1"; t = "Number of customers using search, and the number of searches that return no results." },
  @{ s = "B1"; t = "Filter usage, captured by the value selected." },
  @{ s = "B1"; t = "Number of customers who see an empty state or an error message, including frequency by message type." },
  @{ s = "B1"; t = "Clicks on all CTAs and links within the message detail view." },
  @{ s = "B1"; t = "End-to-end funnel tracking from the message list through to the message detail view and any CTA click." },
  @{ s = "B1"; t = "Ability to segment the data by device type, browser and operating system." },

  @{ s = "H1"; t = "14. Open Items" },
  @{ s = "B1"; t = "Message retention period and pagination threshold." },
  @{ s = "B1"; t = "Whether an unread count is displayed in the account navigation." },
  @{ s = "B1"; t = "Whether customers can sort the list, or delete and archive messages." }
)

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Add()
$sel = $word.Selection

foreach ($item in $content) {
  $sel.Style = $S[$item.s]
  $sel.TypeText($item.t)
  $sel.TypeParagraph()
}

# Trailing empty paragraph cleanup
$sel.Style = $S["Normal"]

$dir = Split-Path $OutPath -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
if (Test-Path $OutPath) { Remove-Item $OutPath -Force }

$doc.SaveAs([ref]$OutPath, [ref]16)  # 16 = wdFormatDocumentDefault (.docx)
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($sel) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($doc) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null

"Saved: $OutPath"
"Size: {0:N0} KB" -f ((Get-Item $OutPath).Length / 1KB)
