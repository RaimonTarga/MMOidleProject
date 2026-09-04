param(
  [string]$Root = "bot/runs/t1-candidate-f-final-2026-09-03",
  [int]$Replicates = 5,
  [ValidateSet("sequential", "isolated-parallel")]
  [string]$ExecutionMode = "sequential",
  [int]$MaxConcurrency = 1,
  [int]$StaggerMs = 0
)

$ErrorActionPreference = "Continue"
$rootPath = [System.IO.Path]::GetFullPath($Root)
New-Item -ItemType Directory -Force -Path $rootPath | Out-Null
$launchLog = Join-Path $rootPath "cohort-launch.log"

$routes = "striker-t1,squire-t1,apprentice-t1,conduit-t1,slinger-t1,spirit-t1"
for ($replicate = 1; $replicate -le $Replicates; $replicate++) {
  $waveRoot = Join-Path $rootPath ("replicate-{0:D2}" -f $replicate)
  New-Item -ItemType Directory -Force -Path $waveRoot | Out-Null
  Add-Content -Path $launchLog -Value "[$(Get-Date -Format o)] starting replicate $replicate/$Replicates"

  & pnpm.cmd bot:batch `
    --controlled=true `
    --executionMode=$ExecutionMode `
    --maxConcurrency=$MaxConcurrency `
    --staggerMs=$StaggerMs `
    --routes=$routes `
    --policies=intended `
    --count=1 `
    --economyArm=F `
    --rewardMultiplier=1 `
    --fresh=true `
    --maxRunMs=10800000 `
    --ui=4500 `
    --out=$waveRoot 2>&1 | Tee-Object -FilePath $launchLog -Append
  $exitCode = $LASTEXITCODE
  Add-Content -Path $launchLog -Value "[$(Get-Date -Format o)] replicate $replicate exit $exitCode"
}

Add-Content -Path $launchLog -Value "[$(Get-Date -Format o)] all replicate waves terminal; generating report"
& pnpm.cmd --filter @mmo-idle/bot exec tsx --conditions=development src/tools/t1FinalReport.ts `
  --root=$rootPath --expected=$($Replicates * 6) 2>&1 | Tee-Object -FilePath $launchLog -Append
Add-Content -Path $launchLog -Value "[$(Get-Date -Format o)] report exit $LASTEXITCODE"
