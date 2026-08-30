@echo off
set "ROOT=%~dp0"
title AI Return Risk Manager

echo Starting Python ML service...
start "ML Service" cmd /k "cd /d ""%ROOT%ml-service"" && uvicorn app:app --reload --port 8000"

timeout /t 3 > nul

echo Starting Spring Boot backend...
start "Backend" cmd /k "cd /d ""%ROOT%backend"" && .\mvnw.cmd spring-boot:run"

timeout /t 5 > nul

echo Starting React frontend...
start "Frontend" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"

echo.
echo All services started.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:9090
echo ML API:   http://127.0.0.1:8000
pause