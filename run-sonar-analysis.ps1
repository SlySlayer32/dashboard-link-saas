# PowerShell script to run SonarQube analysis on key project files

$filesToAnalyze = @(
    "E:\CleanConnect\apps\admin\src\components\ui\ConfirmDialog.tsx",
    "E:\CleanConnect\apps\admin\src\components\ui\Form.tsx",
    "E:\CleanConnect\apps\admin\src\components\ui\Select.tsx",
    "E:\CleanConnect\apps\admin\src\components\ui\Textarea.tsx",
    "E:\CleanConnect\apps\admin\src\components\workers\WorkerCard.tsx",
    "E:\CleanConnect\apps\admin\src\components\workers\WorkerForm.tsx",
    "E:\CleanConnect\apps\admin\src\components\workers\WorkerList.tsx",
    "E:\CleanConnect\apps\admin\src\components\AirtableConfig.tsx",
    "E:\CleanConnect\apps\admin\src\components\DangerZone.tsx",
    "E:\CleanConnect\apps\admin\src\components\DashboardPreview.tsx",
    "E:\CleanConnect\apps\admin\src\components\DashboardStats.tsx",
    "E:\CleanConnect\apps\admin\src\components\DeleteWorkerDialog.tsx",
    "E:\CleanConnect\apps\admin\src\components\DevLoginButton.tsx",
    "E:\CleanConnect\apps\admin\src\components\GoogleCalendarConfig.tsx",
    "E:\CleanConnect\apps\admin\src\components\ManualDataList.tsx",
    "E:\CleanConnect\apps\admin\src\App.tsx",
    "E:\CleanConnect\apps\admin\src\main.tsx",
    "E:\CleanConnect\apps\api\src\index.ts",
    "E:\CleanConnect\apps\api\src\v1.ts",
    "E:\CleanConnect\apps\api\src\types.ts",
    "E:\CleanConnect\packages\database\src\index.ts",
    "E:\CleanConnect\packages\auth\src\index.ts",
    "E:\CleanConnect\packages\shared\src\index.ts",
    "E:\CleanConnect\packages\sms\src\index.ts",
    "E:\CleanConnect\packages\tokens\src\TokenManager.ts",
    "E:\CleanConnect\packages\plugins\src\index.ts",
    "E:\CleanConnect\packages\ui\src\index.ts"
)

Write-Host "Files to analyze:"
$filesToAnalyze | ForEach-Object { Write-Host "  - $_" }

Write-Host "`nRunning SonarQube MCP analysis..."

# Create JSON payload for the MCP server
$jsonPayload = @{
    file_absolute_paths = $filesToAnalyze
} | ConvertTo-Json -Depth 10

Write-Host "JSON payload prepared with $($filesToAnalyze.Count) files"
Write-Host "`nTo run the analysis, you'll need to:"
Write-Host "1. Configure your MCP client to call the 'analyze_file_list' tool"
Write-Host "2. Pass the file paths as shown above"
Write-Host "3. The MCP server will analyze each file for:"
Write-Host "   - Code quality issues"
Write-Host "   - Security vulnerabilities"
Write-Host "   - Code smells"
Write-Host "   - Maintainability issues"

# Save the file list to a JSON file for easy reference
$jsonPayload | Out-File -FilePath "e:\CleanConnect\sonar-analysis-files.json" -Encoding UTF8
Write-Host "`nFile list saved to: sonar-analysis-files.json"
