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

try {
    # 0. Push original project
    Write-Host "Pushing original project..." -ForegroundColor Cyan
    Exec { git push } "Failed to push original project"

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
        Exec { git push -f $repoUrl master:gh-pages } "Git push Mikachu2333 failed"

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
