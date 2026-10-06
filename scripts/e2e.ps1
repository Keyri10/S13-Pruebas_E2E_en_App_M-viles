$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command maestro -ErrorAction SilentlyContinue)) {
  Write-Error "Maestro no está en el PATH. La instalación y el uso están en docs/qa-maestro.md."
}

$flows = @(
  "maestro/auth-01-cliente.yaml",
  "maestro/auth-02-profesional.yaml",
  "maestro/auth-03-correo-invalido.yaml",
  "maestro/cli-01-catalogo.yaml",
  "maestro/cli-02-reservar.yaml",
  "maestro/cli-03-horario-ocupado.yaml",
  "maestro/cli-04-mis-citas.yaml",
  "maestro/cli-05-cancelar.yaml",
  "maestro/pro-01-agenda.yaml",
  "maestro/pro-02-confirmar.yaml",
  "maestro/pro-03-completar.yaml",
  "maestro/pro-04-cancelar.yaml"
)

foreach ($flow in $flows) {
  Write-Host ""
  Write-Host "Reinicio de demostración, luego $flow"
  Invoke-RestMethod -Method Post -Uri "http://localhost:8787/dev/reset" | Out-Null
  maestro test $flow
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
