param(
  [ValidateSet('staging','production')][string]$Target = 'staging',
  [ValidateSet('smtp','accounts')][string]$Mode = 'smtp'
)
$ErrorActionPreference = 'Stop'
$taskSecret = Read-Host $(if ($Mode -eq 'smtp') { 'Gmail 應用程式密碼（不回顯）' } else { '兩個預設帳號的臨時密碼（不回顯）' }) -AsSecureString
$taskPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($taskSecret)
try {
  $taskPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($taskPointer)
  $taskStart = [Diagnostics.ProcessStartInfo]::new()
  $taskStart.FileName = (Get-Command node).Source
  $taskStart.ArgumentList.Add('scripts/auth-setup.mjs')
  $taskStart.ArgumentList.Add($Target)
  $taskStart.ArgumentList.Add($Mode)
  $taskStart.UseShellExecute = $false
  $taskStart.RedirectStandardInput = $true
  $taskProcess = [Diagnostics.Process]::Start($taskStart)
  $taskProcess.StandardInput.Write($taskPlain)
  $taskProcess.StandardInput.Close()
  $taskProcess.WaitForExit()
  if ($taskProcess.ExitCode -ne 0) { throw '設定未完成，請確認登入及資料庫 migration。' }
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($taskPointer)
  $taskPlain = $null
  $taskSecret.Dispose()
}
