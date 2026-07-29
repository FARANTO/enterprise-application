@echo off
cd /d "%~dp0"
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/user-event fast-check
pause
