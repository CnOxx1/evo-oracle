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
      <div className="bg-bg-card/50 backdrop-blur-md border border-accent/10 rounded-xl p-5 mt-6">
        <h4 className="font-semibold mb-2 text-text-primary">Testnet 存取操作</h4>
        <p className="text-sm text-text-secondary">请先连接钱包</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-card/50 backdrop-blur-md border border-accent/10 rounded-xl p-5 mt-6">
      <h4 className="font-semibold mb-4 text-text-primary">Testnet 存取操作</h4>
      <div className="flex gap-3 items-center flex-wrap">
        <input
          type="number"
          className="bg-bg-secondary border border-border rounded-lg px-3 py-2 text-text-primary text-sm w-36 focus:outline-none focus:border-accent transition-colors"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0.01"
          step="0.01"
          placeholder="SUI 数量"
        />
        <button
          className="bg-gradient-to-r from-accent to-blue-500 text-white border-none rounded-lg px-5 py-2 font-semibold cursor-pointer transition-all hover:opacity-90 hover:shadow-[0_0_20px_rgba(108,99,255,0.4)]"
          onClick={handleDeposit}
          disabled={status === "pending"}
        >
          存入 SUI
        </button>
        <button
          className="bg-bg-secondary text-text-primary border border-border rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer hover:border-accent transition-colors"
          onClick={handleWithdraw}
          disabled={status === "pending"}
        >
          取出 SUI
        </button>
      </div>

      {status === "pending" && (
        <p className="text-sm mt-3 text-severity-warning">交易签名中...</p>
      )}
      {status === "success" && txDigest && (
        <p className="text-sm mt-3 text-risk-low">交易成功: {txDigest.slice(0, 16)}...</p>
      )}
      {status === "error" && error && (
        <p className="text-sm mt-3 text-risk-high">{error}</p>
      )}

      {balance && (
        <div className="mt-4 pt-3 border-t border-border text-sm text-text-secondary">
          Vault 余额: <span className="text-text-primary font-semibold">{balance} SUI</span>
        </div>
      )}
    </div>
  );
}
