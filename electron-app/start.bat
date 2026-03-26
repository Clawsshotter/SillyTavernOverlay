@echo off
title SillyTavern Overlay

echo ==========================================================
echo  Starting the SillyTavern Overlay application...
echo  This window must remain open for the overlay to work.
echo  You can minimize it now.
echo ==========================================================
echo.

cd /d "%~dp0"

npm start

echo.
echo Application has been closed. Press any key to exit.
pause