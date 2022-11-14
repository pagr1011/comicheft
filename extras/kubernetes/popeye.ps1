# https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands?view=powershell-7

# Aufruf:   .\popeye.ps1

Set-StrictMode -Version Latest

$versionMinimum = [Version]'7.3.0'
$versionCurrent = $PSVersionTable.PSVersion
if ($versionMinimum -gt $versionCurrent) {
  throw "PowerShell $versionMinimum statt $versionCurrent erforderlich"
}

# Titel setzen
$host.ui.RawUI.WindowTitle = 'popeye'

# https://github.com/derailed/popeye/blob/master/docs/codes.md
$env:POPEYE_REPORT_DIR = "$(Get-Location)\..\..\doc\popeye"
C:\Zimmermann\popeye\popeye.exe --save --out html --output-file index.html
