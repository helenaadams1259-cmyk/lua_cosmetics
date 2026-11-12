import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { RepayButton } from "@/components/account/RepayButton";
import { fetchMyOrder } from "@/lib/customer-api";
import { formatVND } from "@/lib/format";
import {
  customerOrderStatus,
  discountLabel,
  formatDateTimeVN,
  formatVnpayDate,
  isAwaitingPayment,
  orderDisplayCode,
  paymentMethodLabel,
  paymentStatusLabel,
  PAYMENT_STATUS_CLASSES,
  type Order,
  type PaymentTransaction,
} from "@/lib/orders-api";

export const Route = createFileRoute("/tai-khoan/don-hang/$orderId")({
  head: () => ({ meta: [{ title: "Chi tiết đơn hàng — Lụa Cosmetics" }] }),
  component: OrderDetailPage,
});

type TimelineStep = { label: string; done: boolean; note?: string };

function buildTimeline(order: Order): TimelineStep[] {
  const isVnpay = order.payment_method === "vnpay";
  const isPaid = order.payment_status === "paid";
  const reached = (statuses: string[]) => statuses.includes(order.status);
  const steps: TimelineStep[] = [
    { label: "Đặt hàng thành công", done: true, note: formatDateTimeVN(order.created_at) },
  ];
  if (isVnpay) {
    steps.push({
      label: isPaid ? "Thanh toán VNPay thành công" : "Chờ thanh toán VNPay",
      done: isPaid,
      note: isPaid ? formatDateTimeVN(order.paid_at) : "Đơn được giữ lại, bạn có thể thanh toán lại bất cứ lúc nào",
    });
  }
  if (order.status === "cancelled") {
    steps.push({ label: "Đơn hàng đã hủy", done: true });
    return steps;
  }
  steps.push({ label: "Cửa hàng xác nhận đơn", done: reached(["confirmed", "shipping", "completed"]) });
  steps.push({ label: "Đang giao hàng", done: reached(["shipping", "completed"]) });
  steps.push({
    label: "Giao hàng thành công",
    done: reached(["completed"]),
    note: !isVnpay && !reached(["completed"]) ? "Thanh toán khi nhận hàng" : undefined,
  });
  return steps;
}

const TRANSACTION_STATUS: Record<string, { label: string; className: string }> = {
  success: { label: "Thành công", className: "bg-green-50 text-green-700" },
  failed: { label: "Không thành công", className: "bg-red-50 text-red-700" },
  pending: { label: "Chưa hoàn tất", className: "bg-amber-50 text-amber-700" },
};

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["my-order", orderId],
    queryFn: () => fetchMyOrder(orderId),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Đang tải đơn hàng...
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
        <p className="font-semibold">Không tìm thấy đơn hàng</p>
        <Link to="/tai-khoan/don-hang" className="mt-3 inline-block text-sm text-primary hover:underline">
          Quay lại danh sách đơn hàng
        </Link>
      </div>
    );
  }

  const status = customerOrderStatus(order);
  const isVnpay = order.payment_method === "vnpay";
  const hasDiscount = (order.discount_amount ?? 0) > 0;
  const address = [order.street_address, order.ward, order.district, order.province].filter(Boolean).join(", ");
  const paymentClass = PAYMENT_STATUS_CLASSES[order.payment_status ?? "cod"] ?? "bg-slate-100 text-slate-700";

  return (
    <div className="space-y-5">
      <Link to="/tai-khoan/don-hang" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        Đơn hàng của tôi
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Chi tiết đơn hàng {orderDisplayCode(order)}</h1>
        <span data-testid="order-status" className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>

      {isAwaitingPayment(order) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Đơn hàng đã được lưu nhưng chưa ghi nhận thanh toán VNPay. Bạn có thể thanh toán lại để hoàn tất.
          </p>
          <RepayButton order={order} />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Sản phẩm</h2>
            <ul className="mt-2 divide-y divide-border">
              {order.items.map((item, index) => (
                <li key={index} className="flex items-center gap-3 py-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {item.product_image && (
                      <img src={item.product_image} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium">{item.product_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatVND(item.product_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-primary">{formatVND(item.subtotal)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Trạng thái đơn hàng</h2>
            <ol className="mt-4 space-y-4">
              {buildTimeline(order).map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${step.done ? "bg-primary text-primary-foreground" : "border-2 border-border bg-background"}`}
                  >
                    {step.done && <Check className="h-3 w-3" />}
                  </span>
                  <div>
                    <p className={`text-sm ${step.done ? "font-semibold" : "text-muted-foreground"}`}>{step.label}</p>
                    {step.note && <p className="text-xs text-muted-foreground">{step.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {isVnpay && order.transactions && order.transactions.length > 0 && (
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-base font-semibold">Lịch sử giao dịch VNPay</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-medium">Mã tham chiếu</th>
                      <th className="pb-2 font-medium">Thời gian tạo</th>
                      <th className="pb-2 font-medium">Mã GD VNPay</th>
                      <th className="pb-2 text-right font-medium">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {order.transactions.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Thông tin thanh toán</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <DetailRow label="Phương thức" value={paymentMethodLabel(order.payment_method)} />
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground">Trạng thái</dt>
                <dd>
                  <span data-testid="payment-status" className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentClass}`}>
                    {paymentStatusLabel(order.payment_status)}
                  </span>
                </dd>
              </div>
              {isVnpay && (
                <>
                  <DetailRow label="Mã tham chiếu" value={order.vnpay_txn_ref || "—"} mono />
                  <DetailRow label="Mã giao dịch VNPay" value={order.vnpay_transaction_no || "—"} mono />
                  <DetailRow label="Ngân hàng" value={order.vnpay_bank_code || "—"} />
                  <DetailRow
                    label="Thời gian"
                    value={formatVnpayDate(order.vnpay_pay_date) || formatDateTimeVN(order.paid_at) || "—"}
                  />
                </>
              )}
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Giao đến</h2>
            <p className="mt-3 text-sm font-medium">
              {order.customer_name} · {order.phone}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{address}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold">Tổng kết</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              <DetailRow label="Tạm tính" value={formatVND(order.subtotal)} />
              {hasDiscount && (
                <div className="flex items-start justify-between gap-4 text-green-700">
                  <dt>{discountLabel(order)}</dt>
                  <dd className="font-medium">-{formatVND(order.discount_amount ?? 0)}</dd>
                </div>
              )}
              <DetailRow label="Phí vận chuyển" value={formatVND(order.shipping_fee)} />
              <div className="flex items-center justify-between border-t border-border pt-3 text-base">
                <dt className="font-semibold">Tổng cộng</dt>
                <dd className="font-bold text-primary">{formatVND(order.total_amount)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className={`break-all text-right font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function TransactionRow({ transaction }: { transaction: PaymentTransaction }) {
  const status = TRANSACTION_STATUS[transaction.status] ?? TRANSACTION_STATUS.pending;
  return (
    <tr>
      <td className="py-2.5 pr-3 font-mono text-xs">{transaction.txn_ref}</td>
      <td className="py-2.5 pr-3 text-muted-foreground">{formatDateTimeVN(transaction.created_at)}</td>
      <td className="py-2.5 pr-3 font-mono text-xs">{transaction.transaction_no || "—"}</td>
      <td className="py-2.5 text-right">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>{status.label}</span>
      </td>
    </tr>
  );
}
