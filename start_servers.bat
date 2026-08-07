@echo off
echo Starting Backend Server...
start "Backend" cmd /k "cd /d d:\adw8\github\elevance\internshala-clone\backend && npm start"

echo Waiting for backend to start...
timeout /t 5

echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d d:\adw8\github\elevance\internshala-clone\internarea && npm run dev"

echo Both servers started!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo Public Space: http://localhost:3000/publicspace
pause