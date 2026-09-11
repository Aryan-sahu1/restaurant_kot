@echo off
set "PROJECT_DIR=%~dp0"
set "LOG_FILE=%PROJECT_DIR%restaurant-kot-startup.log"

echo [%date% %time%] Starting Restaurant KOT...>> "%LOG_FILE%"

start "Restaurant KOT Backend" cmd /k "cd /d ""%PROJECT_DIR%backend"" && npm.cmd run start:dev"
echo [%date% %time%] Backend start command sent.>> "%LOG_FILE%"
timeout /t 8 /nobreak >nul
start "Restaurant KOT Frontend" cmd /k "cd /d ""%PROJECT_DIR%frontend"" && npm.cmd run dev"
echo [%date% %time%] Frontend start command sent.>> "%LOG_FILE%"
