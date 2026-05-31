#!/usr/bin/env bash
# EvoOracle 合约一键部署脚本 (Sui Testnet)
# 前置条件：已安装 sui CLI，已有测试币

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CONTRACTS_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$CONTRACTS_DIR/../.env"

echo -e "${GREEN}=== EvoOracle 合约部署 (Testnet) ===${NC}"

# 检查 sui CLI
if ! command -v sui &> /dev/null; then
    echo -e "${RED}错误: 未找到 sui CLI${NC}"
    echo "安装: curl -fsSL https://sui.io/install.sh | bash"
    exit 1
fi

# 切换到 testnet
echo -e "${YELLOW}[1/5] 切换到 testnet...${NC}"
sui client switch --env testnet 2>/dev/null || \
    sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# 检查余额
BALANCE=$(sui client gas --json 2>/dev/null | python3 -c "
import sys,json
coins=json.load(sys.stdin)
total=sum(int(c['mistBalance']) for c in coins) if coins else 0
print(total)
" 2>/dev/null || echo "0")

if [ "$BALANCE" -lt 100000000 ]; then
    echo -e "${YELLOW}余额不足，正在领取测试币...${NC}"
    sui client faucet
    sleep 5
fi

# 编译
echo -e "${YELLOW}[2/5] 编译合约...${NC}"
sui move build --path "$CONTRACTS_DIR"

# 部署
echo -e "${YELLOW}[3/5] 部署合约到 testnet...${NC}"
DEPLOY_OUTPUT=$(sui client publish --path "$CONTRACTS_DIR" --gas-budget 200000000 --json)

# 解析部署结果
PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for change in data.get('objectChanges',[]):
    if change.get('type')=='published':
        print(change['packageId'])
        break
")

ADMIN_CAP=$(echo "$DEPLOY_OUTPUT" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for change in data.get('objectChanges',[]):
    if change.get('type')=='created' and 'OracleAdminCap' in change.get('objectType',''):
        print(change['objectId'])
        break
")

echo -e "${GREEN}[3/5] 部署成功!${NC}"
echo "  Package ID:  $PACKAGE_ID"
echo "  AdminCap ID: $ADMIN_CAP"

# 创建 RiskSnapshot 共享对象 (BTC, ETH, SOL, SUI)
echo -e "${YELLOW}[4/5] 创建 RiskSnapshot 共享对象...${NC}"
SYMBOLS=("BTC" "ETH" "SOL" "SUI")
SNAPSHOT_IDS=()

for SYM in "${SYMBOLS[@]}"; do
    RESULT=$(sui client call \
        --package "$PACKAGE_ID" \
        --module oracle \
        --function create_snapshot \
        --args "$ADMIN_CAP" "$SYM" \
        --gas-budget 10000000 \
        --json)

    SNAP_ID=$(echo "$RESULT" | python3 -c "
import sys,json
data=json.load(sys.stdin)
for change in data.get('objectChanges',[]):
    if change.get('type')=='created' and 'RiskSnapshot' in change.get('objectType',''):
        print(change['objectId'])
        break
")
    SNAPSHOT_IDS+=("$SNAP_ID")
    echo "  $SYM Snapshot: $SNAP_ID"
done

# 写入环境变量
echo -e "${YELLOW}[5/5] 写入环境变量...${NC}"
cat > "$ENV_FILE" << EOF
# EvoOracle 合约地址 (Sui Testnet)
# 自动生成于 $(date -Iseconds)
SUI_NETWORK=testnet
PACKAGE_ID=$PACKAGE_ID
ADMIN_CAP_ID=$ADMIN_CAP
SNAPSHOT_BTC=${SNAPSHOT_IDS[0]}
SNAPSHOT_ETH=${SNAPSHOT_IDS[1]}
SNAPSHOT_SOL=${SNAPSHOT_IDS[2]}
SNAPSHOT_SUI=${SNAPSHOT_IDS[3]}
EOF

echo ""
echo -e "${GREEN}=== 部署完成 ===${NC}"
echo -e "  环境变量已写入: $ENV_FILE"
echo -e "  Package ID: $PACKAGE_ID"
echo ""
echo -e "${YELLOW}下一步: 启动 Bridge 服务推送风险数据到链上${NC}"
echo "  cd ../backend && .venv/bin/python -m sui_publisher.publisher"
