import { apiRequest } from "./api-client";

export const AUTH_TOKEN_KEY = "admin_auth_token";
export const ADMIN_USER_KEY = "admin_user_v1";

type LoginResponse = {
  token?: string;
  access_token?: string;
  accessToken?: string;
  data?: { token?: string; access_token?: string; accessToken?: string };
};

export type AdminMe = {
  id: number;
  name: string;
  username: string;
  is_admin: boolean;
  created_at: string;
};

export async function loginRequest(username: string, password: string): Promise<string> {
  const res = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: { username, password },
  });
  const token =
    res.token ??
    res.access_token ??
    res.accessToken ??
    res.data?.token ??
    res.data?.access_token ??
    res.data?.accessToken;
  if (!token) throw new Error("No token");
  return token;
}

export async function fetchAdminMe(): Promise<AdminMe> {
  return apiRequest<AdminMe>("/admin/me", { auth: true });
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getCachedAdminUser(): AdminMe | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? (JSON.parse(raw) as AdminMe) : null;
  } catch {
    return null;
  }
}

export function setCachedAdminUser(user: AdminMe) {
  try {
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearCachedAdminUser() {
  try {
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch {
    // ignore
  }
}

