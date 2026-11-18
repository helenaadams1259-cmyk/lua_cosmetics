import {
  apiRequest,
  getCustomerToken,
  normalizePaginated,
  type PaginatedResponse,
} from "./api-client";

export type OrderItemPayload = {
  product_id: number;
  product_name: string;
  product_image: string;
  product_price: number;
  quantity: number;
  subtotal: number;
};

export type CreateOrderPayload = {
  customer_name: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  street_address: string;
  payment_method: "cod" | "vnpay";
  txn_ref?: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  items: OrderItemPayload[];
  callback_url?: string;
};

export type PaymentTransaction = {
  id: number;
  txn_ref: string;
  amount: number;
  status: string;
  response_code?: string | null;
  transaction_no?: string | null;
  bank_code?: string | null;
  pay_date?: string | null;
  created_at?: string | null;
};

export type OrderItem = {
  product_id: number;
  product_name: string;
  product_image: string;
  product_price: number;
  quantity: number;
  subtotal: number;
};

export type Order = {
  id: number | string;
  customer_name: string;
  phone: string;
  email?: string;
  province?: string;
  district?: string;
  ward?: string;
  street_address?: string;
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
  status: string;
  created_at: string;
  txn_ref?: string;
  items: OrderItem[];
  order_code?: string;
  user_id?: number | null;
  payment_status?: string;
  membership_tier?: string | null;
  discount_percent?: number;
  discount_amount?: number;
  vnpay_txn_ref?: string | null;
  vnpay_transaction_no?: string | null;
  vnpay_bank_code?: string | null;
  vnpay_response_code?: string | null;
  vnpay_pay_date?: string | null;
  paid_at?: string | null;
  payment_url?: string | null;
  transactions?: PaymentTransaction[] | null;
};

export type UpdateOrderPayload = {
  customer_name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street_address: string;
  payment_method: string;
  subtotal: number;
  shipping_fee: number;
  total_amount: number;
};

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  return apiRequest<Order>("/orders", {
    method: "POST",
    body: payload,
    auth: getCustomerToken() ? "customer" : false,
  });
}

export async function fetchAdminOrders({
  page = 1,
  pageSize = 10,
  q,
  paymentStatus,
}: {
  page?: number;
  pageSize?: number;
  q?: string;
  paymentStatus?: string;
} = {}): Promise<PaginatedResponse<Order>> {
  const res = await apiRequest<unknown>("/admin/orders", {
    auth: true,
    query: {
      page,
      page_size: pageSize,
      q: q?.trim() || undefined,
      payment_status: paymentStatus || undefined,
    },
  });
  return normalizePaginated<Order>(res, pageSize);
}

export async function updateOrder(id: number | string, payload: UpdateOrderPayload): Promise<Order> {
  return apiRequest<Order>(`/admin/orders/${id}`, { method: "PUT", body: payload, auth: true });
}

export async function updateOrderStatus(id: number | string, status: string): Promise<Order> {
  return apiRequest<Order>(`/admin/orders/${id}/status`, {
    method: "PUT",
    body: { status },
    auth: true,
  });
}

export async function updateOrderPaymentStatus(
  id: number | string,
  paymentStatus: string,
): Promise<Order> {
  return apiRequest<Order>(`/admin/orders/${id}/payment`, {
    method: "PUT",
    body: { payment_status: paymentStatus },
    auth: true,
  });
}

export async function deleteOrder(id: number | string): Promise<void> {
  await apiRequest<unknown>(`/admin/orders/${id}`, { method: "DELETE", auth: true });
}

export const ORDER_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipping", label: "Đang giao" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

export const ORDER_STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  shipping: "bg-indigo-50 text-indigo-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-700",
};

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function paymentMethodLabel(method: string) {
  if (method === "cod") return "Thanh toán khi nhận hàng (COD)";
  if (method === "vnpay") return "VNPay - Thanh toán online";
  return method;
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  cod: "Thanh toán sau khi nhận hàng",
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  refunded: "Đã hoàn tiền",
};

export const PAYMENT_STATUS_CLASSES: Record<string, string> = {
  cod: "bg-slate-100 text-slate-700",
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
  refunded: "bg-purple-50 text-purple-700",
};

export function paymentStatusLabel(status?: string | null) {
  if (!status) return PAYMENT_STATUS_LABELS.cod;
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

export function paymentMethodShortLabel(method: string) {
  if (method === "cod") return "COD";
  if (method === "vnpay") return "VNPay";
  return method;
}

export function isAwaitingPayment(order: Order) {
  return (
    order.payment_method === "vnpay" &&
    order.payment_status === "pending" &&
    order.status !== "cancelled"
  );
}

export function customerOrderStatus(order: Order): { label: string; className: string } {
  if (isAwaitingPayment(order)) {
    return { label: "Chờ thanh toán", className: PAYMENT_STATUS_CLASSES.pending };
  }
  return {
    label: orderStatusLabel(order.status),
    className: ORDER_STATUS_CLASSES[order.status] ?? "bg-slate-100 text-slate-700",
  };
}

export function orderDisplayCode(order: Order) {
  return order.order_code ?? `#${order.id}`;
}

export function formatDateTimeVN(value?: string | null) {
  if (!value) return "";
  const d = new Date(value.replace(" ", "T"));
  if (isNaN(d.getTime())) return value;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatVnpayDate(value?: string | null) {
  if (!value || value.length !== 14) return value ?? "";
  return `${value.slice(6, 8)}/${value.slice(4, 6)}/${value.slice(0, 4)} ${value.slice(8, 10)}:${value.slice(10, 12)}`;
}

export function vnpayCallbackUrl() {
  return `${window.location.origin}/dat-hang-thanh-cong`;
}

const MEMBERSHIP_TIER_NAMES: Record<string, string> = {
  silver: "Bạc",
  gold: "Vàng",
  diamond: "Kim cương",
};

export function discountLabel(order: Pick<Order, "membership_tier" | "discount_percent">) {
  const tierName = order.membership_tier ? MEMBERSHIP_TIER_NAMES[order.membership_tier] : undefined;
  return tierName
    ? `Ưu đãi hạng ${tierName} (-${order.discount_percent ?? 0}%)`
    : `Ưu đãi thành viên (-${order.discount_percent ?? 0}%)`;
}
