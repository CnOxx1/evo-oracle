import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { beginLogin, extractJwtFromCallback, deriveAddress, loadSession } from "../../lib/zkLogin";

interface AuthState {
  address: string | null;
  jwt: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  handleCallback: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const saved = sessionStorage.getItem("evo_auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { address: parsed.address, jwt: parsed.jwt, isLoading: false };
    }
    return { address: null, jwt: null, isLoading: false };
  });

  const login = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    try {
      const url = await beginLogin();
      window.location.href = url;
    } catch {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const handleCallback = useCallback(() => {
    const jwt = extractJwtFromCallback();
    if (!jwt) return;
    const session = loadSession();
    if (!session) return;
    const address = deriveAddress(jwt, "0");
    setState({ address, jwt, isLoading: false });
    sessionStorage.setItem("evo_auth", JSON.stringify({ address, jwt }));
    window.history.replaceState(null, "", "/");
  }, []);

  const logout = useCallback(() => {
    setState({ address: null, jwt: null, isLoading: false });
    sessionStorage.removeItem("evo_auth");
    sessionStorage.removeItem("evo_zklogin_session");
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, handleCallback, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
