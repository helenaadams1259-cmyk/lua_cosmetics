import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, PackageOpen } from "lucide-react";
import { useState } from "react";
import { RepayButton } from "@/components/account/RepayButton";
import { fetchMyOrderCounts, fetchMyOrders, type OrderStatusFilter } from "@/lib/customer-api";
import { formatVND } from "@/lib/format";
import {
  customerOrderStatus,
  discountLabel,
  formatDateTimeVN,
  isAwaitingPayment,
  orderDisplayCode,
  paymentMethodShortLabel,
  paymentStatusLabel,
  type Order,
} from "@/lib/orders-api";

export const Route = createFileRoute("/tai-khoan/don-hang/")({
  head: () => ({ meta: [{ title: "Đơn hàng của tôi — Lụa Cosmetics" }] }),
  component: MyOrdersPage,
});

const PAGE_SIZE = 5;

const STATUS_TABS: { value: OrderStatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "awaiting_payment", label: "Chờ thanh toán" },
  { value: "processing", label: "Đang xử lý" },
  { value: "shipping", label: "Đang giao" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

function MyOrdersPage() {
  const [status, setStatus] = useState<OrderStatusFilter>("all");
  const [page, setPage] = useState(1);

  const counts = useQuery({ queryKey: ["my-order-counts"], queryFn: fetchMyOrderCounts });
  const orders = useQuery({
    queryKey: ["my-orders", status, page],
    queryFn: () => fetchMyOrders({ status, page, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });

  const changeStatus = (value: OrderStatusFilter) => {
    setStatus(value);
    setPage(1);
  };

  const list = orders.data?.data ?? [];
  const maxPage = orders.data?.maxPage ?? 1;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Đơn hàng của tôi</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => {
          const active = tab.value === status;
          const count = counts.data?.[tab.value];
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => changeStatus(tab.value)}
              data-testid={`order-tab-${tab.value}`}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-secondary"}`}
            >
              {tab.label}
              {typeof count === "number" && <span className="ml-1 opacity-80">({count})</span>}
            </button>
          );
        })}
      </div>

      {orders.isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-border bg-card py-16 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
          Đang tải đơn hàng...
        </div>
      ) : orders.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          Không thể tải danh sách đơn hàng. Vui lòng thử lại.
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <PackageOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-semibold">Chưa có đơn hàng nào</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {status === "all"
              ? "Các đơn bạn đặt khi đã đăng nhập sẽ được lưu tại đây."
              : "Không có đơn hàng nào ở trạng thái này."}
          </p>
          <Link
            to="/san-pham"
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Mua sắm ngay
          </Link>
        </div>
      ) : (
        <div className={`space-y-4 ${orders.isFetching ? "opacity-70" : ""}`}>
          {list.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {maxPage > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border border-border px-4 py-2 font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Trước
          </button>
          <span className="text-muted-foreground">
            Trang {page} / {maxPage}
          </span>
          <button
            type="button"
            disabled={page >= maxPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border border-border px-4 py-2 font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const status = customerOrderStatus(order);
  const hasDiscount = (order.discount_amount ?? 0) > 0;

  return (
    <article data-testid="order-card" className="rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-sm font-semibold">Đơn {orderDisplayCode(order)}</p>
          <p className="text-xs text-muted-foreground">{formatDateTimeVN(order.created_at)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
      </header>

      <ul className="divide-y divide-border px-5">
        {order.items.map((item, index) => (
          <li key={index} className="flex items-center gap-3 py-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.product_image && (
                <img src={item.product_image} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium">{item.product_name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Số lượng: {item.quantity}</p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-primary">{formatVND(item.subtotal)}</p>
          </li>
        ))}
      </ul>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">
          Thanh toán: {paymentMethodShortLabel(order.payment_method)} ·{" "}
          <span data-testid="payment-status" className="font-medium text-foreground">
            {paymentStatusLabel(order.payment_status)}
          </span>
          {hasDiscount && (
            <>
              {" "}
              · {discountLabel(order)}: -{formatVND(order.discount_amount ?? 0)}
            </>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm">
            Tổng cộng: <span className="text-base font-bold text-primary">{formatVND(order.total_amount)}</span>
          </p>
          <Link
            to="/tai-khoan/don-hang/$orderId"
            params={{ orderId: String(order.id) }}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Xem chi tiết
          </Link>
          {isAwaitingPayment(order) && <RepayButton order={order} />}
        </div>
      </footer>
    </article>
  );
}
