# Stop execution on error
$ErrorActionPreference = "Stop"

function Exec {
    param (
        [ScriptBlock]$ScriptBlock,
        [string]$ErrorMessage = "Command failed"
    )
    
    # Execute the script block
    & $ScriptBlock
    
    # Check the exit code of the last command
    if ($LASTEXITCODE -ne 0) {
        throw "$ErrorMessage (Exit code: $LASTEXITCODE)"
    }
}

function Invoke-WithRetry {
    param (
        [ScriptBlock]$ScriptBlock,
        [string]$ErrorMessage = "Command failed",
        [int]$MaxRetries = 3,
        [int]$RetryDelaySeconds = 10
    )
    
    $attempt = 0
    $success = $false
    while ($attempt -lt $MaxRetries -and -not $success) {
        $attempt++
        if ($attempt -gt 1) {
            Write-Host "Retrying command (Attempt $attempt of $MaxRetries)..." -ForegroundColor Yellow
        }
        & $ScriptBlock
        if ($LASTEXITCODE -eq 0) {
            $success = $true
        }
        else {
            if ($attempt -lt $MaxRetries) {
                Write-Host "Command failed. Waiting $RetryDelaySeconds seconds before next attempt..." -ForegroundColor Yellow
                Start-Sleep -Seconds $RetryDelaySeconds
            }
        }
    }
    
    if (-not $success) {
        throw "$ErrorMessage (Exit code: $LASTEXITCODE after $MaxRetries attempts)"
    }
}

try {
    # 0. Push original project
    Write-Host "Pushing original project..." -ForegroundColor Cyan
    Invoke-WithRetry { git push } "Failed to push original project"

    # 1. Build project
    Write-Host "Building project..." -ForegroundColor Cyan
    Exec { npm run docs:build } "Build failed"

    # 2. Enter build output directory
    $distPath = "md_files/.vuepress/dist"
    if (-not (Test-Path $distPath)) {
        throw "Build directory $distPath does not exist!"
    }
    
    # Save current location
    Push-Location $distPath

    try {
        # 3. Initialize temporary Git repository and commit
        Write-Host "Initializing temporary git repository..." -ForegroundColor Cyan
        Exec { git init } "Git init failed"
        
        # Ensure we are on 'master' branch (Git 2.28+ might default to 'main')
        Exec { git checkout -B master } "Failed to switch to master branch"

        # Check for user config script
        if (Get-Command "git-config-user.bat" -ErrorAction SilentlyContinue) {
            Write-Host "Running git-config-user.bat..." -ForegroundColor Cyan
            Exec { git-config-user.bat } "git-config-user.bat failed"
        }
        else {
            Write-Host "Note: git-config-user.bat not found. Using current git configuration." -ForegroundColor Yellow
        }

        Write-Host "Committing build artifacts..." -ForegroundColor Cyan
        Exec { git add -A } "Git add failed"
        Exec { git commit -m "deploy: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" } "Git commit failed"

        # 4. Force push to remote gh-pages branch
        $repoUrl = "https://github.com/Mikachu2333/sdsmu_welcome-web"
        Write-Host "Pushing to gh-pages branch of $repoUrl..." -ForegroundColor Cyan

        # Push local master branch to remote gh-pages branch
        Invoke-WithRetry { git push -f $repoUrl master:gh-pages } "Git push Mikachu2333 failed"

        Write-Host "Deployment complete successfully!" -ForegroundColor Green
    }
    finally {
        # 5. Restore directory location
        Pop-Location
    }
}
catch {
    Write-Error "DEPLOYMENT FAILED: $_"
    exit 1
}
