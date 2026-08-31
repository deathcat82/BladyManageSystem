param(
  [Parameter(Mandatory = $true)]
  [string]$VersionId,
  [string]$Message = "Rollback brow assistant demo"
)

$ErrorActionPreference = "Stop"
$env:Path = "D:\Tools\nodejs;" + $env:Path
& "D:\Tools\nodejs\npx.cmd" wrangler rollback $VersionId --name blady-brow-demo --message $Message

