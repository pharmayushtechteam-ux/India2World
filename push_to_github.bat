@echo off
set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/pharmayushtechteam-ux/India2World.git): "
if "%REPO_URL%"=="" (
    echo No URL entered. Aborting.
    pause
    exit /b
)

cd /d "c:\Users\Windows 10\Desktop\India2World"
git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
echo Pushing to GitHub...
git push -u origin main
echo Done!
pause
