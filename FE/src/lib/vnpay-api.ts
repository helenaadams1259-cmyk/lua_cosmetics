import { apiRequest } from "./api-client";
import type { Order } from "./orders-api";

export type VNPayReturnResult = {
  success: boolean;
  message?: string;
  order: Order | null;
  payment_result?: {
    vnp_ResponseCode: string;
    vnp_TxnRef: string;
    vnp_TransactionNo: string;
    vnp_BankCode: string;
  };
};

export async function confirmVNPayReturn(search: string): Promise<VNPayReturnResult> {
  return apiRequest<VNPayReturnResult>(`/vnpay/return${search}`);
}

export function isValidUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
