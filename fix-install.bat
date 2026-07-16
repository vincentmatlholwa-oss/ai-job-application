@echo off
echo Installing frontend packages...
cd /d "C:\Users\Vincent\Desktop\AI-Job-Application\frontend"
call npm install --no-audit --no-fund
echo.
if exist node_modules\.bin\vite.cmd (
    echo SUCCESS - packages installed
) else (
    echo FAILED - trying again...
    call npm install
)
echo.
echo DONE
