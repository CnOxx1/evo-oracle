import { useAuth } from "./AuthProvider";

export function LoginButton() {
  const { address, login, logout, isLoading } = useAuth();

  if (address) {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <div className="login-btn-group">
        <span className="login-address">{short}</span>
        <button className="btn-logout" onClick={logout}>断开</button>
      </div>
    );
  }

  return (
    <button className="btn-login" onClick={login} disabled={isLoading}>
      {isLoading ? "连接中..." : "zkLogin 登录"}
    </button>
  );
}
