@echo off
setlocal

:prompt
set /p commitName=Please enter commit name: 

if "%commitName%"=="" (
    echo You must enter a name.
    goto prompt
)

git add .
git commit -m "%commitName%"
git push -u origin main