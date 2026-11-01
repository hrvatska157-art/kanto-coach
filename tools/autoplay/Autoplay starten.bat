@echo off
rem Kanto Coach Autoplay (Entwicklerversion aus dem Projekt) - oeffnet das Programmfenster.
rem Fertige .exe bauen: node tools\autoplay\build-exe.js  ->  dist\autoplay\KantoCoachAutoplay.exe
cd /d "%~dp0..\.."
node tools\autoplay\app.js
pause
