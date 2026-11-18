import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  MOCK_USERS,
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_BRANDS,
  type AdminUser,
  type AdminProduct,
  type AdminCategory,
  type AdminBrand,
} from "./admin-data";
import {
  AUTH_TOKEN_KEY,
  clearAuthToken,
  setAuthToken,
  fetchAdminMe,
  getCachedAdminUser,
  setCachedAdminUser,
  clearCachedAdminUser,
  type AdminMe,
} from "./auth-api";

const DATA_KEY = "admin_data_v1";


export type AdminData = {
  users: AdminUser[];
  products: AdminProduct[];
  categories: AdminCategory[];
  brands: AdminBrand[];
};

type Ctx = {
  authed: boolean;
  user: AdminMe | null;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  data: AdminData;
  setUsers: (u: AdminUser[]) => void;
  setProducts: (p: AdminProduct[]) => void;
  setCategories: (c: AdminCategory[]) => void;
  setBrands: (b: AdminBrand[]) => void;
};

const AdminCtx = createContext<Ctx | null>(null);

const initialData: AdminData = {
  users: MOCK_USERS,
  products: MOCK_PRODUCTS,
  categories: MOCK_CATEGORIES,
  brands: MOCK_BRANDS,
};

function shallowEqualUser(a: AdminMe | null, b: AdminMe | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.username === b.username &&
    a.is_admin === b.is_admin &&
    a.created_at === b.created_at
  );
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState<AdminMe | null>(null);
  const [data, setData] = useState<AdminData>(initialData);
  const [ready, setReady] = useState(false);

  const doLogout = () => {
    clearAuthToken();
    clearCachedAdminUser();
    setAuthed(false);
    setUser(null);
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
      window.location.href = "/admin/login";
    }
  };

  const refreshMe = async () => {
    try {
      const me = await fetchAdminMe();
      setUser((prev) => (shallowEqualUser(prev, me) ? prev : me));
      setCachedAdminUser(me);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("401") || msg.includes("403")) {
        doLogout();
      }
    }
  };

  useEffect(() => {
    try {
      const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY);
      setAuthed(hasToken);
      if (hasToken) {
        const cached = getCachedAdminUser();
        if (cached) setUser(cached);
      }
      const raw = localStorage.getItem(DATA_KEY);
      if (raw) setData({ ...initialData, ...JSON.parse(raw) });
    } catch {
      // ignore
    }
    setReady(true);

    const onAuthFailed = () => doLogout();
    window.addEventListener("admin:auth-failed", onAuthFailed);
    return () => window.removeEventListener("admin:auth-failed", onAuthFailed);
  }, []);

  // Silent background refresh when authed
  useEffect(() => {
    if (ready && authed) {
      void refreshMe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authed]);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
    }
  }, [data, ready]);

  const loginWithToken = async (token: string) => {
    setAuthToken(token);
    setAuthed(true);
    try {
      const me = await fetchAdminMe();
      setUser(me);
      setCachedAdminUser(me);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("401") || msg.includes("403")) {
        doLogout();
        throw err;
      }
      throw err;
    }
  };

  const logout = () => {
    clearAuthToken();
    clearCachedAdminUser();
    setAuthed(false);
    setUser(null);
  };

  return (
    <AdminCtx.Provider
      value={{
        authed,
        user,
        loginWithToken,
        logout,
        refreshMe,
        data,
        setUsers: (users) => setData((d) => ({ ...d, users })),
        setProducts: (products) => setData((d) => ({ ...d, products })),
        setCategories: (categories) => setData((d) => ({ ...d, categories })),
        setBrands: (brands) => setData((d) => ({ ...d, brands })),
      }}
    >
      {children}
    </AdminCtx.Provider>
  );
}

export const useAdmin = () => {
  const c = useContext(AdminCtx);
  if (!c) throw new Error("AdminProvider missing");
  return c;
};

