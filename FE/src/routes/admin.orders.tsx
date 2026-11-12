import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Search, Loader2, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAuthToken } from "@/lib/auth-api";
import {
  fetchAdminOrders,
  updateOrder,
  updateOrderStatus,
  updateOrderPaymentStatus,
  deleteOrder,
  discountLabel,
  formatVnpayDate,
  ORDER_STATUS_CLASSES,
  ORDER_STATUS_OPTIONS,
  orderDisplayCode,
  orderStatusLabel,
  paymentMethodLabel,
  paymentMethodShortLabel,
  paymentStatusLabel,
  PAYMENT_STATUS_CLASSES,
  type Order,
  type UpdateOrderPayload,
} from "@/lib/orders-api";
import { formatVND } from "@/lib/format";
import { Pagination } from "@/routes/admin.users";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
});

function formatDateTimeVN(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type EditForm = UpdateOrderPayload;

function toEditForm(o: Order): EditForm {
  return {
    customer_name: o.customer_name ?? "",
    phone: o.phone ?? "",
    province: o.province ?? "",
    district: o.district ?? "",
    ward: o.ward ?? "",
    street_address: o.street_address ?? "",
    payment_method: o.payment_method ?? "cod",
    subtotal: Number(o.subtotal) || 0,
    shipping_fee: Number(o.shipping_fee) || 0,
    total_amount: Number(o.total_amount) || 0,
  };
}

function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paymentFilter, setPaymentFilter] = useState("");
  const [paymentUpdating, setPaymentUpdating] = useState(false);

  const [viewing, setViewing] = useState<Order | null>(null);
  const [editing, setEditing] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Order | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | string | null>(null);

  const load = async (p = page, ps = pageSize, term = debouncedQ, payment = paymentFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminOrders({ page: p, pageSize: ps, q: term, paymentStatus: payment });
      setOrders(res.data);
      setTotal(res.total);
      setMaxPage(Math.max(1, res.maxPage));
    } catch {
      setError("Không thể tải danh sách đơn hàng.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      navigate({ to: "/admin/login" });
      return;
    }
    load(page, pageSize, debouncedQ, paymentFilter);
     
  }, [page, pageSize, debouncedQ, paymentFilter]);

  useEffect(() => {
    setPage(1);
     
  }, [debouncedQ, paymentFilter]);

  const filtered = orders;

  const openEdit = (o: Order) => {
    setEditing(o);
    setEditForm(toEditForm(o));
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editing || !editForm) return;
    if (!editForm.customer_name.trim() || !editForm.phone.trim()) {
      toast.error("Vui lòng nhập họ tên và số điện thoại");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateOrder(editing.id, editForm);
      setOrders((list) => list.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)));
      toast.success("Cập nhật đơn hàng thành công");
      closeEdit();
    } catch {
      toast.error("Không thể cập nhật đơn hàng");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (o: Order, status: string) => {
    if (status === o.status) return;
    setStatusUpdatingId(o.id);
    try {
      const updated = await updateOrderStatus(o.id, status);
      setOrders((list) => list.map((it) => (it.id === o.id ? { ...it, ...updated } : it)));
      toast.success("Đã cập nhật trạng thái");
    } catch {
      toast.error("Không thể cập nhật trạng thái");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handlePaymentStatus = async (o: Order, paymentStatus: string) => {
    setPaymentUpdating(true);
    try {
      const updated = await updateOrderPaymentStatus(o.id, paymentStatus);
      const merged = { ...o, ...updated, transactions: o.transactions };
      setOrders((list) => list.map((it) => (it.id === o.id ? merged : it)));
      setViewing((current) => (current && current.id === o.id ? merged : current));
      toast.success(paymentStatus === "refunded" ? "Đã ghi nhận hoàn tiền" : "Đã xác nhận thanh toán");
    } catch {
      toast.error("Không thể cập nhật trạng thái thanh toán");
    } finally {
      setPaymentUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setDeletingId(id);
    try {
      await deleteOrder(id);
      setOrders((list) => list.filter((o) => o.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Đã xóa đơn hàng");
      setConfirmDelete(null);
    } catch {
      toast.error("Không thể xóa đơn hàng");
    } finally {
      setDeletingId(null);
    }
  };

  const patchForm = (patch: Partial<EditForm>) =>
    setEditForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <AdminShell title="Quản lý đơn hàng">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo mã đơn, khách hàng, SĐT hoặc mã giao dịch VNPay..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            aria-label="Lọc theo trạng thái thanh toán"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-pink-500"
          >
            <option value="">Tất cả trạng thái thanh toán</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="paid">Đã thanh toán</option>
            <option value="cod">Thanh toán sau khi nhận hàng</option>
            <option value="refunded">Đã hoàn tiền</option>
          </select>
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã đơn</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Số điện thoại</th>
                <th className="px-4 py-3">Tổng tiền</th>
                <th className="px-4 py-3">Thanh toán</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                      <span>Đang tải danh sách đơn hàng...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : (
                filtered.map((o) => {
                  const cls = ORDER_STATUS_CLASSES[o.status] ?? "bg-slate-100 text-slate-700";
                  const isStatusUpdating = statusUpdatingId === o.id;
                  return (
                    <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{orderDisplayCode(o)}</td>
                      <td className="px-4 py-3 font-medium">{o.customer_name}</td>
                      <td className="px-4 py-3 text-slate-600">{o.phone}</td>
                      <td className="px-4 py-3 font-semibold text-pink-700">
                        {formatVND(o.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-slate-700">
                          {paymentMethodShortLabel(o.payment_method)}
                        </div>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_CLASSES[o.payment_status ?? "cod"] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {paymentStatusLabel(o.payment_status)}
                        </span>
                        {o.vnpay_txn_ref && (
                          <div className="mt-1 font-mono text-[11px] text-slate-500">{o.vnpay_txn_ref}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
                            {orderStatusLabel(o.status)}
                          </span>
                          <select
                            value={o.status}
                            disabled={isStatusUpdating}
                            onChange={(e) => handleStatusChange(o, e.target.value)}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-pink-500"
                          >
                            {ORDER_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          {isStatusUpdating && (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDateTimeVN(o.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewing(o)}
                            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEdit(o)}
                            className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50"
                            title="Sửa"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(o)}
                            className="rounded-md p-1.5 text-red-600 hover:bg-red-50"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <fieldset disabled={loading} className="contents">
          <Pagination
            page={page}
            maxPage={maxPage}
            total={total}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={(s) => {
              setPageSize(s);
              setPage(1);
            }}
          />
        </fieldset>
      </div>

      {/* View details */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng {viewing ? orderDisplayCode(viewing) : ""}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <Info label="Khách hàng" value={viewing.customer_name} />
                <Info label="Số điện thoại" value={viewing.phone} />
                <Info label="Email" value={viewing.email || "-"} />
                <Info label="Phương thức" value={paymentMethodLabel(viewing.payment_method)} />
                <Info
                  label="Địa chỉ"
                  value={[viewing.street_address, viewing.ward, viewing.district, viewing.province]
                    .filter(Boolean)
                    .join(", ")}
                />
                <Info label="Ngày tạo" value={formatDateTimeVN(viewing.created_at)} />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-medium uppercase text-slate-500">Đối soát thanh toán</div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_CLASSES[viewing.payment_status ?? "cod"] ?? "bg-slate-100 text-slate-700"}`}
                  >
                    {paymentStatusLabel(viewing.payment_status)}
                  </span>
                </div>
                {viewing.payment_method === "vnpay" && (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Info label="Mã tham chiếu (vnpay_txn_ref)" value={viewing.vnpay_txn_ref || "-"} />
                    <Info label="Mã giao dịch VNPay" value={viewing.vnpay_transaction_no || "-"} />
                    <Info label="Ngân hàng" value={viewing.vnpay_bank_code || "-"} />
                    <Info label="Thời gian thanh toán" value={formatVnpayDate(viewing.vnpay_pay_date) || "-"} />
                  </div>
                )}
                {viewing.transactions && viewing.transactions.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-white">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 uppercase text-slate-500">
                        <tr>
                          <th className="px-2 py-1.5 text-left">Mã tham chiếu</th>
                          <th className="px-2 py-1.5 text-left">Mã GD VNPay</th>
                          <th className="px-2 py-1.5 text-left">Mã phản hồi</th>
                          <th className="px-2 py-1.5 text-right">Kết quả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewing.transactions.map((t) => (
                          <tr key={t.id} className="border-t border-slate-100">
                            <td className="px-2 py-1.5 font-mono">{t.txn_ref}</td>
                            <td className="px-2 py-1.5 font-mono">{t.transaction_no || "-"}</td>
                            <td className="px-2 py-1.5">{t.response_code || "-"}</td>
                            <td className="px-2 py-1.5 text-right">
                              {t.status === "success" ? "Thành công" : t.status === "failed" ? "Không thành công" : "Chưa hoàn tất"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {viewing.payment_status !== "paid" && viewing.payment_status !== "refunded" && (
                    <button
                      onClick={() => handlePaymentStatus(viewing, "paid")}
                      disabled={paymentUpdating}
                      className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      Xác nhận đã thanh toán
                    </button>
                  )}
                  {viewing.payment_status === "paid" && (
                    <button
                      onClick={() => handlePaymentStatus(viewing, "refunded")}
                      disabled={paymentUpdating}
                      className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-60"
                    >
                      Ghi nhận hoàn tiền
                    </button>
                  )}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-medium uppercase text-slate-500">Sản phẩm</div>
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Sản phẩm</th>
                        <th className="px-3 py-2 text-right">Đơn giá</th>
                        <th className="px-3 py-2 text-right">SL</th>
                        <th className="px-3 py-2 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewing.items.map((it, i) => (
                        <tr key={i} className="border-t border-slate-100">
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {it.product_image && (
                                <img
                                  src={it.product_image}
                                  alt=""
                                  className="h-10 w-10 rounded object-cover"
                                />
                              )}
                              <span>{it.product_name}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">{formatVND(it.product_price)}</td>
                          <td className="px-3 py-2 text-right">{it.quantity}</td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatVND(it.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 text-sm">
                <div className="text-slate-600">
                  Tạm tính: <span className="font-medium">{formatVND(viewing.subtotal)}</span>
                </div>
                {(viewing.discount_amount ?? 0) > 0 && (
                  <div className="text-green-700">
                    {discountLabel(viewing)}:{" "}
                    <span className="font-medium">-{formatVND(viewing.discount_amount ?? 0)}</span>
                  </div>
                )}
                <div className="text-slate-600">
                  Phí vận chuyển:{" "}
                  <span className="font-medium">{formatVND(viewing.shipping_fee)}</span>
                </div>
                <div className="text-base font-semibold text-pink-700">
                  Tổng cộng: {formatVND(viewing.total_amount)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setViewing(null)}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Đóng
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && closeEdit()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sửa đơn hàng #{editing?.id}</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Họ tên khách hàng">
                <input
                  value={editForm.customer_name}
                  onChange={(e) => patchForm({ customer_name: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Số điện thoại">
                <input
                  value={editForm.phone}
                  onChange={(e) => patchForm({ phone: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Tỉnh / Thành phố">
                <input
                  value={editForm.province}
                  onChange={(e) => patchForm({ province: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Quận / Huyện">
                <input
                  value={editForm.district}
                  onChange={(e) => patchForm({ district: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Phường / Xã">
                <input
                  value={editForm.ward}
                  onChange={(e) => patchForm({ ward: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Phương thức thanh toán">
                <select
                  value={editForm.payment_method}
                  onChange={(e) => patchForm({ payment_method: e.target.value })}
                  className="input"
                >
                  <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                </select>
              </Field>
              <Field label="Địa chỉ chi tiết" className="sm:col-span-2">
                <input
                  value={editForm.street_address}
                  onChange={(e) => patchForm({ street_address: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Tạm tính">
                <input
                  type="number"
                  value={editForm.subtotal}
                  onChange={(e) => patchForm({ subtotal: Number(e.target.value) || 0 })}
                  className="input"
                />
              </Field>
              <Field label="Phí vận chuyển">
                <input
                  type="number"
                  value={editForm.shipping_fee}
                  onChange={(e) => patchForm({ shipping_fee: Number(e.target.value) || 0 })}
                  className="input"
                />
              </Field>
              <Field label="Tổng cộng" className="sm:col-span-2">
                <input
                  type="number"
                  value={editForm.total_amount}
                  onChange={(e) => patchForm({ total_amount: Number(e.target.value) || 0 })}
                  className="input"
                />
              </Field>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={closeEdit}
              disabled={saving}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Lưu thay đổi
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Bạn có chắc muốn xóa đơn hàng{" "}
            <span className="font-semibold">#{confirmDelete?.id}</span>? Hành động này không thể
            hoàn tác.
          </p>
          <DialogFooter>
            <button
              onClick={() => setConfirmDelete(null)}
              disabled={deletingId !== null}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deletingId !== null}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deletingId !== null && <Loader2 className="h-4 w-4 animate-spin" />}
              Xóa đơn hàng
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: rgb(236 72 153); box-shadow: 0 0 0 2px rgb(252 231 243); }
      `}</style>
    </AdminShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-0.5 text-slate-800">{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}
