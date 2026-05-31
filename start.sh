#!/usr/bin/env bash
# EvoOracle 一键启动脚本
# 同时拉起后端 API 服务和前端开发服务器

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cleanup() {
    echo -e "\n${YELLOW}正在关闭所有服务...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}已关闭${NC}"
}
trap cleanup EXIT INT TERM

# 检查后端虚拟环境
if [ ! -f "$BACKEND_DIR/.venv/bin/python" ]; then
    echo -e "${RED}错误: 后端虚拟环境不存在，请先运行:${NC}"
    echo "  cd $BACKEND_DIR && python -m venv .venv && .venv/bin/pip install -r requirements.txt"
    exit 1
fi

# 检查前端 node_modules
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo -e "${YELLOW}前端依赖未安装，正在安装...${NC}"
    (cd "$FRONTEND_DIR" && npm install)
fi

echo -e "${GREEN}=== EvoOracle 启动 ===${NC}"
echo ""

# 启动后端 API 服务
echo -e "${GREEN}[1/2] 启动后端 API (http://127.0.0.1:8100)${NC}"
(cd "$BACKEND_DIR" && .venv/bin/python -m server.app) &
BACKEND_PID=$!

# 等待后端就绪
sleep 2

# 启动前端开发服务器
echo -e "${GREEN}[2/2] 启动前端 Dev Server (http://localhost:5173)${NC}"
(cd "$FRONTEND_DIR" && npx vite) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}=== 全部服务已启动 ===${NC}"
echo -e "  后端 API:  http://127.0.0.1:8100"
echo -e "  前端页面:  http://localhost:5173"
echo -e "  按 Ctrl+C 关闭所有服务"
echo ""

wait
