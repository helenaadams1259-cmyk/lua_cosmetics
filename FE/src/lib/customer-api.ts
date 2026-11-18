import { apiRequest, normalizePaginated, type PaginatedResponse } from "./api-client";
import type { Order } from "./orders-api";

export type MembershipTier = {
  code: string;
  name: string;
  min_spent: number;
  discount_percent: number;
};

export type MembershipSummary = {
  total_spent: number;
  tier: MembershipTier;
  next_tier: MembershipTier | null;
  amount_to_next: number;
  progress_percent: number;
  tiers: MembershipTier[];
};

export type MembershipPreview = {
  total_spent: number;
  current_tier: MembershipTier;
  applied_tier: MembershipTier;
  upgraded: boolean;
  discount_percent: number;
  discount_amount: number;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
};

export type Account = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  province: string | null;
  district: string | null;
  ward: string | null;
  street_address: string | null;
  created_at: string | null;
  membership: MembershipSummary;
};

export type AccountSession = {
  access_token: string;
  user: Account;
};

export type RegisterPayload = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export type ProfilePayload = {
  name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street_address: string;
};

export type OrderStatusFilter =
  | "all"
  | "awaiting_payment"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled";

export type OrderCounts = Record<string, number>;

export function tierLabel(tier: MembershipTier): string {
  return tier.code === "member" ? "Thành viên" : `Thành viên ${tier.name}`;
}

export function registerAccount(payload: RegisterPayload): Promise<AccountSession> {
  return apiRequest<AccountSession>("/account/register", { method: "POST", body: payload });
}

export function loginAccount(identifier: string, password: string): Promise<AccountSession> {
  return apiRequest<AccountSession>("/account/login", {
    method: "POST",
    body: { identifier, password },
  });
}

export function fetchAccount(): Promise<Account> {
  return apiRequest<Account>("/account/me", { auth: "customer" });
}

export function updateAccount(payload: ProfilePayload): Promise<Account> {
  return apiRequest<Account>("/account/me", { method: "PUT", body: payload, auth: "customer" });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<unknown> {
  return apiRequest("/account/change-password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
    auth: "customer",
  });
}

export function requestPasswordReset(email: string): Promise<unknown> {
  return apiRequest("/account/forgot-password", {
    method: "POST",
    body: { email, reset_url: `${window.location.origin}/dat-lai-mat-khau` },
  });
}

export async function validateResetToken(token: string): Promise<boolean> {
  const res = await apiRequest<{ valid: boolean }>("/account/reset-password/validate", {
    query: { token },
  });
  return Boolean(res?.valid);
}

export function resetPassword(token: string, newPassword: string): Promise<unknown> {
  return apiRequest("/account/reset-password", {
    method: "POST",
    body: { token, new_password: newPassword },
  });
}

export function fetchMembershipPreview(
  subtotal: number,
  shippingFee: number,
): Promise<MembershipPreview> {
  return apiRequest<MembershipPreview>("/account/membership/preview", {
    auth: "customer",
    query: { subtotal, shipping_fee: shippingFee },
  });
}

export async function fetchMyOrders({
  status,
  page = 1,
  pageSize = 5,
}: {
  status: OrderStatusFilter;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<Order>> {
  const res = await apiRequest<unknown>("/account/orders", {
    auth: "customer",
    query: { status: status === "all" ? undefined : status, page, page_size: pageSize },
  });
  return normalizePaginated<Order>(res, pageSize);
}

export function fetchMyOrderCounts(): Promise<OrderCounts> {
  return apiRequest<OrderCounts>("/account/orders/counts", { auth: "customer" });
}

export function fetchMyOrder(orderId: string | number): Promise<Order> {
  return apiRequest<Order>(`/account/orders/${orderId}`, { auth: "customer" });
}

export function repayOrder(orderId: string | number, callbackUrl: string): Promise<Order> {
  return apiRequest<Order>(`/account/orders/${orderId}/repay`, {
    method: "POST",
    body: { callback_url: callbackUrl },
    auth: "customer",
  });
}
