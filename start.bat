@echo off
echo Starting AI Job Application...
echo.

echo Starting Backend (port 3009)...
start "Backend" cmd /c "cd /d C:\Users\Vincent\Desktop\AI-Job-Application\backend && node server.js"

timeout /t 3 /nobreak >nul

echo Starting Frontend (port 5173)...
start "Frontend" cmd /c "cd /d C:\Users\Vincent\Desktop\AI-Job-Application\frontend && npx vite --host"

echo.
echo ============================================
echo   Servers starting...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3009
echo ============================================
echo.
pause
