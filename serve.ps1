param(
    [int]$Port = 8765,
    [string]$Bind = "127.0.0.1"
)
Set-Location -Path $PSScriptRoot
$py = Get-Command py -ErrorAction SilentlyContinue
if ($py) {
    & py -3 .\serve.py --port $Port --bind $Bind
} else {
    & python .\serve.py --port $Port --bind $Bind
}
