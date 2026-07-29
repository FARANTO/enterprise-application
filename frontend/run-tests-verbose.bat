@echo off
echo Running Vitest Tests...
echo.
cd /d "%~dp0"
call npx vitest run --reporter=verbose > test-results.txt 2>&1
type test-results.txt
echo.
echo Test results saved to test-results.txt
pause
