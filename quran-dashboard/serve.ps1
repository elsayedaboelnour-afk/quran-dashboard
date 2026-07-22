$port = 3001
$localPath = "C:\Users\e.ouf2512\.gemini\antigravity\scratch\quran-dashboard"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
Write-Host "Starting Quran Dashboard server on port $port..."
try {
    $listener.Start()
    Write-Host "Server started: http://127.0.0.1:$port/"
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        $rawUrl = $request.RawUrl.Split('?')[0]
        if ($rawUrl -eq "/") { $rawUrl = "/index.html" }
        $relPath = $rawUrl.TrimStart('/')
        $filePath = Join-Path $localPath $relPath
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = "text/html; charset=utf-8"
            if ($ext -eq ".css") { $contentType = "text/css; charset=utf-8" }
            elseif ($ext -eq ".js") { $contentType = "application/javascript; charset=utf-8" }
            elseif ($ext -eq ".png") { $contentType = "image/png" }
            elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") { $contentType = "image/jpeg" }
            elseif ($ext -eq ".svg") { $contentType = "image/svg+xml" }
            elseif ($ext -eq ".ico") { $contentType = "image/x-icon" }
            elseif ($ext -eq ".pdf") { $contentType = "application/pdf" }
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found: $rawUrl")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} catch {
    Write-Host "Error: $_"
} finally {
    if ($listener) { $listener.Close() }
}
