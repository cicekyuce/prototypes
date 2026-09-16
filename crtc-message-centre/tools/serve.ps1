param(
    [string]$Root = ""
)

$ErrorActionPreference = "Stop"

if (-not $Root) { $Root = Split-Path -Parent $PSScriptRoot }
$port = 8123

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root at http://localhost:$port/"

$mime = @{
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "text/javascript"
    ".pdf"  = "application/pdf"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
    ".ttf"  = "font/ttf"
}

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        try {
            $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
            if ($path.EndsWith("/")) { $path = $path + "index.html" }
            $relative = $path.TrimStart("/") -replace "/", "\"
            $file = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
            if ($file.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and (Test-Path $file -PathType Leaf)) {
                $bytes = [System.IO.File]::ReadAllBytes($file)
                $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
                if ($mime.ContainsKey($ext)) { $ctx.Response.ContentType = $mime[$ext] } else { $ctx.Response.ContentType = "application/octet-stream" }
                $ctx.Response.Headers.Add("Cache-Control", "no-store")
                $ctx.Response.ContentLength64 = $bytes.Length
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $ctx.Response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("Not found")
                $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
            }
        } catch {
            $ctx.Response.StatusCode = 500
        } finally {
            $ctx.Response.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
}
