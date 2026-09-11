$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = Join-Path $projectDir "start-restaurant-kot.bat"
$startupDir = [Environment]::GetFolderPath("Startup")
$shortcutPath = Join-Path $startupDir "Restaurant KOT.lnk"

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = $projectDir
$shortcut.Description = "Start Restaurant KOT backend and frontend"
$shortcut.Save()

Write-Host "Startup shortcut created:"
Write-Host $shortcutPath
