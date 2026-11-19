@echo off
title CoMeBench - visual editor launcher
cd /d "%~dp0"

echo ============================================
echo   CoMeBench  可视化编辑器
echo ============================================
echo.
echo 正在启动本地服务 http://127.0.0.1:5500 ...
echo.

start "CoMeBench local server" /min cmd /c "python -m http.server 5500"
timeout /t 2 >nul
start "" "http://127.0.0.1:5500/?edit=1"

echo 浏览器已打开编辑模式。
echo.
echo 直接在网页上点击文字修改，改完点底部「保存修改」。
echo.
echo 服务在最小化的黑窗口里运行，关掉那个窗口即可停止。
timeout /t 4 >nul
