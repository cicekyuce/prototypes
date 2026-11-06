$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

function ConvertTo-PdfEscaped([string]$s) {
    return $s.Replace('\', '\\').Replace('(', '\(').Replace(')', '\)')
}

function New-ContentStream([object[]]$blocks) {
    $cmds = New-Object System.Collections.Generic.List[string]
    $y = 756
    foreach ($b in $blocks) {
        if ($b.ContainsKey("Spacer")) { $y -= [int]$b.Spacer; continue }
        if ($b.ContainsKey("GapBefore")) { $y -= [int]$b.GapBefore }
        $x = 72
        if ($b.ContainsKey("X")) { $x = [int]$b.X }
        $cmds.Add("BT /$($b.F) $($b.Size) Tf $x $y Td ($(ConvertTo-PdfEscaped $b.Text)) Tj ET")
        $y -= [math]::Round([double]$b.Size * 1.35 + 4)
    }
    return ($cmds -join "`n")
}

function New-Pdf([string]$outPath, [string]$content) {
    $objs = @(
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>",
        "<< /Length $($content.Length) >>`nstream`n$content`nendstream"
    )
    $sb = New-Object System.Text.StringBuilder
    [void]$sb.Append("%PDF-1.4`n")
    $offsets = New-Object System.Collections.Generic.List[int]
    for ($i = 0; $i -lt $objs.Count; $i++) {
        $offsets.Add($sb.Length)
        [void]$sb.Append("$($i + 1) 0 obj`n$($objs[$i])`nendobj`n")
    }
    $xrefPos = $sb.Length
    [void]$sb.Append("xref`n0 $($objs.Count + 1)`n0000000000 65535 f `n")
    foreach ($off in $offsets) {
        [void]$sb.Append($off.ToString("0000000000") + " 00000 n `n")
    }
    [void]$sb.Append("trailer`n<< /Size $($objs.Count + 1) /Root 1 0 R >>`nstartxref`n$xrefPos`n%%EOF`n")
    $dir = Split-Path -Parent $outPath
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($outPath, $sb.ToString(), [System.Text.Encoding]::ASCII)
    Write-Host "Wrote $outPath"
}

function New-WrappedLines([string]$text, [int]$maxChars) {
    $words = $text -split " "
    $lines = @()
    $current = ""
    foreach ($w in $words) {
        if ($current -eq "") { $current = $w }
        elseif (($current.Length + 1 + $w.Length) -le $maxChars) { $current = $current + " " + $w }
        else { $lines += $current; $current = $w }
    }
    if ($current -ne "") { $lines += $current }
    return $lines
}

function New-LetterBlocks([string]$title, [string]$date, [string[]]$paragraphs, [string]$ref) {
    $blocks = @(
        @{ F = "F2"; Size = 20; Text = "Freedom Mobile" },
        @{ Spacer = 16 },
        @{ F = "F2"; Size = 15; Text = $title },
        @{ F = "F3"; Size = 10; Text = $date; GapBefore = 4 },
        @{ Spacer = 24 },
        @{ F = "F1"; Size = 11; Text = "Dear Customer," },
        @{ Spacer = 12 }
    )
    foreach ($p in $paragraphs) {
        foreach ($line in (New-WrappedLines $p 88)) {
            $blocks += @{ F = "F1"; Size = 11; Text = $line }
        }
        $blocks += @{ Spacer = 12 }
    }
    $blocks += @{ Spacer = 18 }
    $blocks += @{ F = "F2"; Size = 10; Text = $ref }
    return $blocks
}

$tosBlocks = @(
    @{ F = "F2"; Size = 20; Text = "Freedom Mobile" },
    @{ Spacer = 16 },
    @{ F = "F2"; Size = 15; Text = "Important update to your Terms of Service" },
    @{ F = "F3"; Size = 10; Text = "August 30, 2026"; GapBefore = 4 },
    @{ Spacer = 24 },
    @{ F = "F1"; Size = 11; Text = "Dear Customer," },
    @{ Spacer = 12 },
    @{ F = "F1"; Size = 11; Text = "We are writing to inform you about changes to the Terms of Service that apply to your" },
    @{ F = "F1"; Size = 11; Text = "mobile services. These changes take effect on January 1, 2027." },
    @{ Spacer = 16 },
    @{ F = "F2"; Size = 12; Text = "What is changing" },
    @{ Spacer = 8 },
    @{ F = "F1"; Size = 11; Text = "1. Late payment charges: the late payment charge will change from 2.5% to 2.75% of the" },
    @{ F = "F1"; Size = 11; X = 90; Text = "overdue amount, capped at $75 per billing cycle." },
    @{ F = "F1"; Size = 11; Text = "2. Roaming: pay-per-use roaming rates will be updated for Zone 1 and Zone 2" },
    @{ F = "F1"; Size = 11; X = 90; Text = "destinations, as described in the updated Roaming Rates section." },
    @{ F = "F1"; Size = 11; Text = "3. Dispute resolution: the process for escalating unresolved complaints has been" },
    @{ F = "F1"; Size = 11; X = 90; Text = "clarified, including complaints that remain unresolved more than 30 days after filing." },
    @{ Spacer = 14 },
    @{ F = "F1"; Size = 11; Text = "Your current plan, price and promotions are not affected by these changes." },
    @{ Spacer = 14 },
    @{ F = "F1"; Size = 11; Text = "A copy of the updated Terms of Service is available on our website or by contacting us." },
    @{ F = "F1"; Size = 11; Text = "If you do not agree with the updated terms, you may terminate your services without an" },
    @{ F = "F1"; Size = 11; Text = "early cancellation fee by notifying us before January 1, 2027." },
    @{ Spacer = 14 },
    @{ F = "F3"; Size = 11; Text = "This notice is provided in accordance with the Wireless Code established by the Canadian" },
    @{ F = "F3"; Size = 11; Text = "Radio-television and Telecommunications Commission - CRTC." },
    @{ Spacer = 30 },
    @{ F = "F2"; Size = 10; Text = "Reference: TOS-2027-0101" }
)

New-Pdf -outPath (Join-Path $root "assets\docs\crtc-tos-update.pdf") -content (New-ContentStream $tosBlocks)

New-Pdf -outPath (Join-Path $root "assets\docs\welcome-postpaid.pdf") -content (New-ContentStream (New-LetterBlocks "Welcome to Freedom Mobile - Postpaid service has been activated" "September 10, 2026" @("Your postpaid service is now active. Your plan, add-ons and promotions have been applied as described in your service agreement.", "You can view your plan details, usage and promotions at any time from My Account.") "Reference: ACT-2026-0910"))

New-Pdf -outPath (Join-Path $root "assets\docs\device-shipment.pdf") -content (New-ContentStream (New-LetterBlocks "Freedom Mobile - Device shipment confirmation" "September 10, 2026" @("Great news - your device has shipped! You'll receive a tracking number by email or text message once your package is on its way.", "If you have any questions about your delivery, contact us or visit My Account.") "Reference: SHIP-2026-0910"))

New-Pdf -outPath (Join-Path $root "assets\docs\welcome-prepaid.pdf") -content (New-ContentStream (New-LetterBlocks "Welcome to Freedom Mobile - Prepaid service has been activated" "September 4, 2026" @("Your prepaid service is now active. Your plan, add-ons and promotions have been applied as described in your service agreement.", "You can view your plan details, usage and promotions at any time from My Account.") "Reference: ACT-2026-0904"))

New-Pdf -outPath (Join-Path $root "assets\docs\agreement-amendment.pdf") -content (New-ContentStream (New-LetterBlocks "Services Agreement Amendment" "March 24, 2026" @("An amendment has been made to your services agreement. This message confirms that the updated agreement is now available in My Account.", "The changes take effect on your next billing cycle. No action is required if you agree with the updated terms.") "Reference: SAA-2026-0324"))

New-Pdf -outPath (Join-Path $root "assets\docs\welcome-postpaid-feb.pdf") -content (New-ContentStream (New-LetterBlocks "Welcome to Freedom Mobile - Postpaid service has been activated" "February 20, 2026" @("Your postpaid service is now active. Your plan, add-ons and promotions have been applied as described in your service agreement.", "You can view your plan details, usage and promotions at any time from My Account.") "Reference: ACT-2026-0220"))
