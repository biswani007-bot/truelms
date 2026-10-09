@echo off
echo Running npm ci...
call npm ci
if %errorlevel% neq 0 exit /b %errorlevel%
echo Running tsc...
call npx tsc --noEmit
if %errorlevel% neq 0 exit /b %errorlevel%
echo Running build...
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
echo BUILD SUCCESSFUL
