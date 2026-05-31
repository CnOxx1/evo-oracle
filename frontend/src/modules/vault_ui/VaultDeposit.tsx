import { useState } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../../lib/suiClient";

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || "0x0";
const VAULT_ID = import.meta.env.VITE_VAULT_ID || "0x0";

interface VaultDepositProps {
  walletAddress: string | null;
  signAndExecute: ((tx: Transaction) => Promise<{ digest: string }>) | null;
  onSuccess: () => void;
}

type TxStatus = "idle" | "pending" | "success" | "error";

export function VaultDeposit({ walletAddress, signAndExecute, onSuccess }: VaultDepositProps) {
  const [amount, setAmount] = useState("0.1");
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  // 查询 vault 余额
  const fetchVaultBalance = async () => {
    if (VAULT_ID === "0x0") return;
    try {
      const obj = await suiClient.getObject({
        id: VAULT_ID,
        options: { showContent: true },
      });
      const fields = (obj.data?.content as any)?.fields;
      if (fields?.sui_balance) {
        const bal = Number(fields.sui_balance) / 1e9;
        setBalance(bal.toFixed(4));
      }
    } catch { /* ignore */ }
  };

  const handleDeposit = async () => {
    if (!signAndExecute || !walletAddress) return;
    setStatus("pending");
    setError(null);

    try {
      const tx = new Transaction();
      const amountMist = Math.floor(Number(amount) * 1e9);
      const [coin] = tx.splitCoins(tx.gas, [amountMist]);
      tx.moveCall({
        target: `${PACKAGE_ID}::risk_vault::deposit`,
        arguments: [tx.object(VAULT_ID), coin],
      });

      const result = await signAndExecute(tx);
      setTxDigest(result.digest);
      setStatus("success");
      fetchVaultBalance();
      onSuccess();
    } catch (e: any) {
      setError(e.message || "交易失败");
      setStatus("error");
    }
  };

  const handleWithdraw = async () => {
    if (!signAndExecute || !walletAddress) return;
    setStatus("pending");
    setError(null);

    try {
      const tx = new Transaction();
      const amountMist = Math.floor(Number(amount) * 1e9);
      tx.moveCall({
        target: `${PACKAGE_ID}::risk_vault::withdraw`,
        arguments: [tx.object(VAULT_ID), tx.pure.u64(amountMist)],
      });

      const result = await signAndExecute(tx);
      setTxDigest(result.digest);
      setStatus("success");
      fetchVaultBalance();
      onSuccess();
    } catch (e: any) {
      setError(e.message || "交易失败");
      setStatus("error");
    }
  };

  if (!walletAddress) {
    return (
      <div className="vault-actions">
        <h4>Testnet 存取操作</h4>
        <p className="vault-actions__status">请先连接钱包</p>
      </div>
    );
  }

  return (
    <div className="vault-actions">
      <h4>Testnet 存取操作</h4>
      <div className="vault-actions__form">
        <input
          type="number"
          className="vault-actions__input"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          placeholder="SUI 数量"
        />
        <button className="btn-deposit" onClick={handleDeposit}
          disabled={status === "pending"}>
          存入 SUI
        </button>
        <button className="btn-withdraw" onClick={handleWithdraw}
          disabled={status === "pending"}>
          取出 SUI
        </button>
      </div>

      {status === "pending" && (
        <p className="vault-actions__status vault-actions__status--pending">
          交易签名中...
        </p>
      )}
      {status === "success" && txDigest && (
        <p className="vault-actions__status vault-actions__status--success">
          交易成功: {txDigest.slice(0, 16)}...
        </p>
      )}
      {status === "error" && error && (
        <p className="vault-actions__status vault-actions__status--error">
          {error}
        </p>
      )}

      {balance && (
        <div className="vault-balance">
          <div className="vault-balance__item">
            Vault 余额: <span>{balance} SUI</span>
          </div>
        </div>
      )}
    </div>
  );
}
