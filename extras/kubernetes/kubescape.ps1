# https://docs.microsoft.com/en-us/powershell/scripting/developer/cmdlet/approved-verbs-for-windows-powershell-commands?view=powershell-7

# Aufruf:   .\kubescape.ps1

Set-StrictMode -Version Latest

$versionMinimum = [Version]'7.3.0'
$versionCurrent = $PSVersionTable.PSVersion
if ($versionMinimum -gt $versionCurrent) {
    throw "PowerShell $versionMinimum statt $versionCurrent erforderlich"
}

# Titel setzen
$host.ui.RawUI.WindowTitle = 'kubescape'

# https://github.com/zegl/kube-score
$release = 'comicheft'
Set-Location ..\helm
helm template $release . -f values.yaml -f dev.yaml > ${env:TEMP}\$release.yaml
C:\Zimmermann\kubescape\kubescape.exe scan --enable-host-scan --verbose C:/temp/$release.yaml
Set-Location ..\kubernetes
