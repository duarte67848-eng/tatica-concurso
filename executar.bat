@echo off
cd /d "%~dp0"
rmdir /s /q .next 2>nul
npm run dev
pause