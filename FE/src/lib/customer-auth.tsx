import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { clearCustomerToken, getCustomerToken, setCustomerToken } from "./api-client";
import {
  fetchAccount,
  loginAccount,
  registerAccount,
  type Account,
  type RegisterPayload,
} from "./customer-api";

type CustomerAuthContextType = {
  user: Account | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<Account>;
  register: (payload: RegisterPayload) => Promise<Account>;
  logout: () => void;
  refresh: () => Promise<void>;
  setUser: (user: Account) => void;
};

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getCustomerToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await fetchAccount());
    } catch {
      clearCustomerToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onAuthFailed = () => {
      clearCustomerToken();
      setUser(null);
    };
    window.addEventListener("customer:auth-failed", onAuthFailed);
    return () => window.removeEventListener("customer:auth-failed", onAuthFailed);
  }, []);

  const login = async (identifier: string, password: string) => {
    const session = await loginAccount(identifier, password);
    setCustomerToken(session.access_token);
    setUser(session.user);
    return session.user;
  };

  const register = async (payload: RegisterPayload) => {
    const session = await registerAccount(payload);
    setCustomerToken(session.access_token);
    setUser(session.user);
    return session.user;
  };

  const logout = () => {
    clearCustomerToken();
    setUser(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ user, loading, login, register, logout, refresh, setUser }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
};
