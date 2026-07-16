@echo off
echo ============================================
echo   AI Job Application Assistant - Setup
echo ============================================
echo.

echo Installing root dependencies...
call npm install
echo.

echo Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo.

echo Installing backend dependencies...
cd backend
call npm install
cd ..
echo.

echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo To start the application:
echo   npm run dev
echo.
echo The app will be available at:
echo   http://localhost:5173
echo.
echo For AI features, add your OpenAI API key to:
echo   backend\.env
echo.
pause
