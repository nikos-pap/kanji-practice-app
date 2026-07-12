param(
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$address = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
        $_.IPAddress -ne '127.0.0.1' -and
        $_.IPAddress -notlike '169.254.*' -and
        $_.PrefixOrigin -ne 'WellKnown' -and
        $_.InterfaceOperationalStatus -eq 'Up'
    } |
    Sort-Object InterfaceMetric |
    Select-Object -First 1 -ExpandProperty IPAddress

Write-Host ''
Write-Host 'Kanji Practice LAN server' -ForegroundColor Cyan
Write-Host "Computer: http://localhost:$Port/"
if ($address) {
    Write-Host "Phone:    http://${address}:$Port/" -ForegroundColor Green
} else {
    Write-Host 'Could not detect the LAN address. Run ipconfig and use the IPv4 address.' -ForegroundColor Yellow
}
Write-Host 'Keep this window open. Press Ctrl+C to stop.'
Write-Host 'The phone and computer must be on the same local network.'
Write-Host ''

if (Get-Command py -ErrorAction SilentlyContinue) {
    & py -m http.server $Port --bind 0.0.0.0
    exit $LASTEXITCODE
}

if (Get-Command python -ErrorAction SilentlyContinue) {
    & python -m http.server $Port --bind 0.0.0.0
    exit $LASTEXITCODE
}

if (Get-Command npx -ErrorAction SilentlyContinue) {
    & npx --yes http-server . -a 0.0.0.0 -p $Port -c-1
    exit $LASTEXITCODE
}

throw 'No local server was found. Install Python or Node.js, then run this file again.'
