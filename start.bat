@echo off
cd /d "%~dp0"
del /f /q package-lock.json 2>nul
npm run dev