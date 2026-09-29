@echo off
echo ========================================
echo   我们的聊天室 - 启动脚本
echo ========================================
echo.
echo 确保已安装 Node.js (推荐 18.x 或更高版本)
echo.
echo 一键部署步骤:
echo.
echo 1. 安装依赖:
echo    npm install
echo.
echo 2. 启动服务:
echo    npm start
echo.
echo 3. 访问网站:
echo    http://localhost:3000
echo.
echo ========================================
echo.

if not exist node_modules (
  echo 正在安装依赖...
  call npm install
  if errorlevel 1 (
    echo.
    echo 错误: npm install 失败，请确保已安装 Node.js
    pause
    exit /b 1
  )
)

echo 正在启动聊天服务...
echo.
node server.js
pause
