import { getAuthToken } from "./auth-api";

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export const CUSTOMER_TOKEN_KEY = "customer_auth_token";

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function clearCustomerToken() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  detail: string | null;

  constructor(status: number, detail: string | null) {
    super(`HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.detail) return error.detail;
  return fallback;
}

async function readErrorDetail(res: Response): Promise<string | null> {
  try {
    const data = (await res.json()) as { detail?: unknown; message?: unknown };
    if (typeof data.detail === "string") return data.detail;
    if (typeof data.message === "string") return data.message;
    return null;
  } catch {
    return null;
  }
}

export type ApiOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean | "customer";
  query?: Record<string, string | number | undefined>;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  maxPage: number;
};

export function buildQuery(query?: Record<string, string | number | undefined>) {
  if (!query) return "";
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function apiRequest<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, auth = false, query } = opts;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...headers,
  };
  if (auth) {
    const token = auth === "customer" ? getCustomerToken() : getAuthToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}${buildQuery(query)}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    if (auth && (res.status === 401 || res.status === 403)) {
      if (typeof window !== "undefined") {
        const eventName = auth === "customer" ? "customer:auth-failed" : "admin:auth-failed";
        window.dispatchEvent(new CustomEvent(eventName));
      }
    }
    throw new ApiError(res.status, await readErrorDetail(res));
  }
  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

/**
 * Normalize any admin list response into the paginated shape. Supports both the
 * new `{ data, total, maxPage }` format and legacy array responses.
 */
export function normalizePaginated<T>(
  res: unknown,
  fallbackPageSize: number,
): PaginatedResponse<T> {
  if (Array.isArray(res)) {
    const data = res as T[];
    return { data, total: data.length, maxPage: Math.max(1, Math.ceil(data.length / fallbackPageSize)) };
  }
  const obj = (res ?? {}) as { data?: T[]; total?: number; maxPage?: number };
  const data = Array.isArray(obj.data) ? obj.data : [];
  const total = typeof obj.total === "number" ? obj.total : data.length;
  const maxPage =
    typeof obj.maxPage === "number" && obj.maxPage > 0
      ? obj.maxPage
      : Math.max(1, Math.ceil(total / fallbackPageSize));
  return { data, total, maxPage };
}
