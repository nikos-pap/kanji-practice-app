param(
    [int]$Port = 8000
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Get-UsableLanAddresses {
    $results = @()

    # Prefer active adapters that have a default gateway (normally Wi-Fi/Ethernet).
    $configs = Get-NetIPConfiguration -ErrorAction SilentlyContinue |
        Where-Object {
            $_.NetAdapter.Status -eq 'Up' -and
            $_.IPv4Address -and
            $_.IPv4DefaultGateway
        }

    foreach ($config in $configs) {
        foreach ($ipv4 in @($config.IPv4Address)) {
            $ip = $ipv4.IPAddress
            if ($ip -and $ip -ne '127.0.0.1' -and $ip -notlike '169.254.*') {
                $metric = 999999
                if ($config.NetIPInterface -and $null -ne $config.NetIPInterface.InterfaceMetric) {
                    $metric = [int]$config.NetIPInterface.InterfaceMetric
                }
                $results += [pscustomobject]@{
                    IPAddress = $ip
                    Interface = $config.InterfaceAlias
                    Metric = $metric
                }
            }
        }
    }

    # Fallback for networks that do not expose a default gateway.
    if ($results.Count -eq 0) {
        $connectedIndexes = @(Get-NetIPInterface -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object { $_.ConnectionState -eq 'Connected' } |
            Select-Object -ExpandProperty InterfaceIndex)

        $addresses = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
            Where-Object {
                $_.InterfaceIndex -in $connectedIndexes -and
                $_.AddressState -eq 'Preferred' -and
                $_.IPAddress -ne '127.0.0.1' -and
                $_.IPAddress -notlike '169.254.*'
            }

        foreach ($address in $addresses) {
            $results += [pscustomobject]@{
                IPAddress = $address.IPAddress
                Interface = $address.InterfaceAlias
                Metric = 999999
            }
        }
    }

    return $results |
        Sort-Object Metric, Interface, IPAddress -Unique
}

$addresses = @(Get-UsableLanAddresses)

Write-Host ''
Write-Host 'Kanji Practice LAN server' -ForegroundColor Cyan
Write-Host "Computer: http://localhost:$Port/"

if ($addresses.Count -gt 0) {
    Write-Host 'Open one of these addresses on the phone:' -ForegroundColor Green
    foreach ($address in $addresses) {
        Write-Host ("  http://{0}:{1}/  ({2})" -f $address.IPAddress, $Port, $address.Interface) -ForegroundColor Green
    }
} else {
    Write-Host 'No LAN IPv4 address was detected. Run ipconfig and use the Wi-Fi/Ethernet IPv4 address.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Keep this window open. The phone and computer must be on the same non-guest Wi-Fi/LAN.'
Write-Host 'If the computer works but the phone times out, allow TCP port 8000 through Windows Firewall on Private networks.' -ForegroundColor Yellow
Write-Host 'Press Ctrl+C to stop.'
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
