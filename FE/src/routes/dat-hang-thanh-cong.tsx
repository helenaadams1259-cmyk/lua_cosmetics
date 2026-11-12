import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Package } from "lucide-react";
import { RepayButton } from "@/components/account/RepayButton";
import { useCustomerAuth } from "@/lib/customer-auth";
import { formatVND } from "@/lib/format";
import {
  type Order,
  customerOrderStatus,
  discountLabel,
  formatDateTimeVN,
  isAwaitingPayment,
  orderDisplayCode,
  paymentMethodLabel,
  paymentStatusLabel,
  PAYMENT_STATUS_CLASSES,
} from "@/lib/orders-api";
import { confirmVNPayReturn } from "@/lib/vnpay-api";

const ORDER_KEY = "cosmetic_last_order";

export const Route = createFileRoute("/dat-hang-thanh-cong")({
  head: () => ({ meta: [{ title: "Đặt hàng thành công — Lụa Cosmetics" }] }),
  component: OrderSuccess,
});

function readStoredOrder(): Order | null {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

function OrderSuccess() {
  const { user, refresh } = useCustomerAuth();
  const [storedOrder] = useState<Order | null>(readStoredOrder);
  const [vnpaySearch] = useState(() =>
    new URLSearchParams(window.location.search).has("vnp_TxnRef") ? window.location.search : "",
  );

  const vnpay = useQuery({
    queryKey: ["vnpay-return", vnpaySearch],
    queryFn: () => confirmVNPayReturn(vnpaySearch),
    enabled: Boolean(vnpaySearch),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const confirmedOrder = vnpay.data?.order ?? null;

  useEffect(() => {
    if (!confirmedOrder) return;
    localStorage.setItem(ORDER_KEY, JSON.stringify(confirmedOrder));
    refresh();
  }, [confirmedOrder, refresh]);

  if (vnpaySearch && vnpay.isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 px-4 py-24 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-semibold">Đang xác nhận kết quả thanh toán VNPay...</p>
        <p className="text-sm text-muted-foreground">Vui lòng không đóng trang này.</p>
      </div>
    );
  }

  const order = confirmedOrder ?? storedOrder;

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">
          {vnpay.isError ? "Không xác nhận được giao dịch" : "Không có đơn hàng nào"}
        </h1>
        {vnpay.isError && (
          <p className="mt-2 text-sm text-muted-foreground">
            Thông tin trả về từ VNPay không hợp lệ. Nếu bạn đã bị trừ tiền, vui lòng liên hệ hotline 1900 6868
            kèm mã giao dịch để được đối soát.
          </p>
        )}
        <Link to="/san-pham" className="mt-4 inline-block text-primary hover:underline">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const isVnpay = order.payment_method === "vnpay";
  const isPaid = order.payment_status === "paid";
  const awaitingPayment = isAwaitingPayment(order);
  const ownsOrder = Boolean(user) && order.user_id === user?.id;
  const address = [order.street_address, order.ward, order.district, order.province].filter(Boolean).join(", ");
  const status = customerOrderStatus(order);
  const paymentClass = PAYMENT_STATUS_CLASSES[order.payment_status ?? "cod"] ?? "bg-slate-100 text-slate-700";
  const hasDiscount = (order.discount_amount ?? 0) > 0;

  const heading = !isVnpay
    ? "Đặt hàng thành công!"
    : isPaid
      ? "Thanh toán thành công!"
      : "Thanh toán chưa hoàn tất";
  const description = !isVnpay
    ? "Cảm ơn bạn đã mua sắm tại Lụa Cosmetics. Đơn hàng của bạn đang được xử lý."
    : isPaid
      ? "Cảm ơn bạn đã mua sắm tại Lụa Cosmetics. Đơn hàng đã được ghi nhận thanh toán qua VNPay."
      : ownsOrder
        ? "Đơn hàng đã được lưu ở trạng thái chờ thanh toán. Bạn có thể thanh toán lại ngay hoặc vào Đơn hàng của tôi bất cứ lúc nào."
        : "Đơn hàng đã được lưu ở trạng thái chờ thanh toán. Nếu bạn đã bị trừ tiền, vui lòng liên hệ hotline 1900 6868 kèm mã giao dịch để được đối soát.";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:py-16">
      <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-lg md:p-12">
        <div
          className={`mx-auto grid h-20 w-20 place-items-center rounded-full ${awaitingPayment ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}
        >
          {awaitingPayment ? <AlertTriangle className="h-11 w-11" /> : <CheckCircle2 className="h-12 w-12" />}
        </div>
        <h1 data-testid="result-heading" className="mt-6 text-2xl font-bold md:text-3xl">
          {heading}
        </h1>
        <p className="mt-2 text-muted-foreground">{description}</p>

        <div className="mt-8 rounded-2xl bg-secondary/50 p-6 text-left">
          <div className="mb-4 flex items-center gap-2 text-primary">
            <Package className="h-5 w-5" />
            <p className="font-semibold">Chi tiết đơn hàng</p>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Row label="Mã đơn hàng" value={orderDisplayCode(order)} strong />
            <Row label="Ngày tạo đơn" value={formatDateTimeVN(order.created_at)} />
            {order.vnpay_txn_ref && <Row label="Mã tham chiếu VNPay" value={order.vnpay_txn_ref} full />}
            {order.vnpay_transaction_no && <Row label="Mã giao dịch VNPay" value={order.vnpay_transaction_no} />}
            {order.vnpay_bank_code && <Row label="Ngân hàng" value={order.vnpay_bank_code} />}
            <Row label="Họ và tên" value={order.customer_name} />
            <Row label="Số điện thoại" value={order.phone} />
            <Row label="Địa chỉ giao hàng" value={address} full />
            <Row label="Phương thức thanh toán" value={paymentMethodLabel(order.payment_method)} full />

            <div>
              <dt className="text-xs text-muted-foreground">Trạng thái thanh toán</dt>
              <dd className="mt-1">
                <span data-testid="payment-status" className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${paymentClass}`}>
                  {paymentStatusLabel(order.payment_status)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Trạng thái đơn hàng</dt>
              <dd className="mt-1">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-3 text-sm font-semibold">Sản phẩm</p>
            <ul className="space-y-2 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {it.product_name} × {it.quantity}
                  </span>
                  <span className="font-medium">{formatVND(it.subtotal)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatVND(order.subtotal)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-green-700">
                <span>{discountLabel(order)}</span>
                <span className="font-medium">-{formatVND(order.discount_amount ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phí vận chuyển</span>
              <span>{formatVND(order.shipping_fee)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base">
              <span className="font-semibold">Tổng cộng</span>
              <span className="font-bold text-primary">{formatVND(order.total_amount)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {awaitingPayment && ownsOrder && (
            <RepayButton
              order={order}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
            />
          )}
          {ownsOrder && (
            <Link
              to="/tai-khoan/don-hang"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-secondary"
            >
              Xem đơn hàng của tôi
            </Link>
          )}
          <Link
            to="/san-pham"
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold ${awaitingPayment && ownsOrder ? "border border-border hover:bg-secondary" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong, full }: { label: string; value: string; strong?: boolean; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-0.5 break-all ${strong ? "font-bold text-primary" : "font-medium"}`}>{value}</dd>
    </div>
  );
}
