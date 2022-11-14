# Aufruf:   .\delete-pvc.ps1

Set-StrictMode -Version Latest

$versionMinimum = [Version]'7.3.0'
$versionCurrent = $PSVersionTable.PSVersion
if ($versionMinimum -gt $versionCurrent) {
    throw "PowerShell $versionMinimum statt $versionCurrent erforderlich"
}

# Titel setzen
$host.ui.RawUI.WindowTitle = 'postgres delete pvc'

$namespace = 'acme'
kubectl delete pvc/postgres-data-volume-postgres-0 --namespace $namespace
kubectl delete pvc/postgres-conf-volume-postgres-0 --namespace $namespace
kubectl delete pvc/postgres-tablespace-volume-postgres-0 --namespace $namespace
kubectl delete pvc/postgres-run-volume-postgres-0 --namespace $namespace
kubectl delete pvc/pgadmin-pgadmin-volume-pgadmin-0 --namespace $namespace
kubectl delete pvc/pgadmin-pgadmin4-volume-pgadmin-0 --namespace $namespace
