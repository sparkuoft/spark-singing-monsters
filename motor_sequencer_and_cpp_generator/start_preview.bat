@echo off
REM This batch file should live in motor_sequencer_and_cpp_generator/.
REM Serve from the parent repository directory so ../motor_output/data works.
cd /d "%~dp0.."
echo Repository web root: %CD%
echo Open: http://127.0.0.1:8765/motor_sequencer_and_cpp_generator/index.html
py -m http.server 8765 --bind 127.0.0.1 --directory "%CD%"
pause
