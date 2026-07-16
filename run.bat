@echo off
echo ============================================
echo   Building Frontend for Production...
echo ============================================
echo.

cd /d C:\Users\Vincent\Desktop\AI-Job-Application\frontend
call npx vite build
if %errorlevel% neq 0 (
    echo.
    echo Build failed! Trying dev mode instead...
    goto :dev
)

echo.
echo ============================================
echo   Starting AI Job Application on port 3009
echo ============================================
echo   Open http://localhost:3009
echo ============================================
echo.

cd /d C:\Users\Vincent\Desktop\AI-Job-Application\backend
set NODE_ENV=production
node server.js
goto :end

:dev
echo.
echo Starting in dev mode...
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:3009
echo.

start "Backend" cmd /c "cd /d C:\Users\Vincent\Desktop\AI-Job-Application\backend && node server.js"
start "Frontend" cmd /c "cd /d C:\Users\Vincent\Desktop\AI-Job-Application\frontend && npx vite --host"

:end
pause
