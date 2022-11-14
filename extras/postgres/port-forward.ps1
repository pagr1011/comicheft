# https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands?view=powershell-7

# Aufruf:   .\port-forward.ps1

# "Param" muss in der 1. Zeile sein
Param (
    [string]$service = 'pgadmin'
)

Set-StrictMode -Version Latest

$versionMinimum = [Version]'7.3.0'
$versionCurrent = $PSVersionTable.PSVersion
if ($versionMinimum -gt $versionCurrent) {
    throw "PowerShell $versionMinimum statt $versionCurrent erforderlich"
}

# Titel setzen
$host.ui.RawUI.WindowTitle = "$service port forward"

$namespace = 'acme'
kubectl port-forward service/$service 8888:80 --namespace $namespace
