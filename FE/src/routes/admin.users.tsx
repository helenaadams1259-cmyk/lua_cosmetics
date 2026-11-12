import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAuthToken } from "@/lib/auth-api";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  type ApiUser,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "@/lib/users-api";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import { Search, Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

const PAGE_SIZE_OPTIONS = [10, 20, 50];

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

function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [deleting, setDeleting] = useState<ApiUser | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const load = async (p = page, ps = pageSize, term = debouncedQ) => {
    setLoading(true);
    try {
      const res = await fetchUsers({ page: p, pageSize: ps, q: term });
      setUsers(res.data);
      setTotal(res.total);
      setMaxPage(Math.max(1, res.maxPage));
    } catch {
      toast.error("Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      navigate({ to: "/admin/login" });
      return;
    }
    load(page, pageSize, debouncedQ);
  }, [page, pageSize, debouncedQ]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingLoading(true);
    try {
      await deleteUser(deleting.id);
      toast.success("Xóa người dùng thành công");
      setDeleting(null);
      await load(page, pageSize);
    } catch {
      toast.error("Xóa người dùng thất bại");
    } finally {
      setDeletingLoading(false);
    }
  };

  return (
    <AdminShell title="Quản lý người dùng">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo họ tên hoặc tên đăng nhập..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Thêm người dùng
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Họ và tên</th>
                <th className="px-4 py-3">Tên đăng nhập</th>
                <th className="px-4 py-3">Quyền</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{u.id}</td>
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-slate-600">{u.username}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-medium " +
                          (u.is_admin ? "bg-pink-50 text-pink-700" : "bg-slate-100 text-slate-600")
                        }
                      >
                        {u.is_admin ? "Quản trị viên" : "Người dùng"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTimeVN(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditing(u)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Sửa
                        </button>
                        <button
                          onClick={() => setDeleting(u)}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
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
        )}
      </div>

      <CreateUserDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={async () => {
          setCreating(false);
          await load(page, pageSize);
        }}
      />

      <EditUserDialog
        user={editing}
        onClose={() => setEditing(null)}
        onSaved={async () => {
          setEditing(null);
          await load(page, pageSize);
        }}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(o) => !o && !deletingLoading && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng
              {deleting ? ` "${deleting.name}"` : ""}? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deletingLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang xóa...
                </span>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminShell>
  );
}

export function Pagination({
  page,
  maxPage,
  total,
  pageSize,
  onPage,
  onPageSize,
}: {
  page: number;
  maxPage: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span>Tổng cộng {total} bản ghi</span>
        <label className="flex items-center gap-2">
          <span className="text-slate-500">Hiển thị</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="rounded-md border border-slate-200 px-2 py-1 text-sm"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="text-slate-500">/ trang</span>
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-50"
        >
          Trước
        </button>
        <span className="px-3">
          Trang {page} / {maxPage}
        </span>
        <button
          onClick={() => onPage(Math.min(maxPage, page + 1))}
          disabled={page >= maxPage}
          className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

function CreateUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm người dùng</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (submitting) return;
            const fd = new FormData(e.currentTarget);
            const payload: CreateUserPayload = {
              name: String(fd.get("name") || "").trim(),
              username: String(fd.get("username") || "").trim(),
              password: String(fd.get("password") || ""),
              is_admin: true,
            };
            if (!payload.name || !payload.username || !payload.password) {
              toast.error("Vui lòng nhập đầy đủ thông tin");
              return;
            }
            setSubmitting(true);
            try {
              await createUser(payload);
              toast.success("Thêm người dùng thành công");
              await onCreated();
            } catch {
              toast.error("Thêm người dùng thất bại");
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <fieldset disabled={submitting} className="space-y-3">
            <Field label="Họ và tên" name="name" required />
            <Field label="Tên đăng nhập" name="username" required />
            <Field label="Mật khẩu" name="password" type="password" required />
          </fieldset>
          <DialogFooter>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Đang lưu..." : "Lưu"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: ApiUser | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const open = !!user;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa người dùng</DialogTitle>
        </DialogHeader>
        {user && (
          <form
            key={user.id}
            onSubmit={async (e) => {
              e.preventDefault();
              if (submitting) return;
              const fd = new FormData(e.currentTarget);
              const name = String(fd.get("name") || "").trim();
              const password = String(fd.get("password") || "");
              if (!name) {
                toast.error("Vui lòng nhập họ và tên");
                return;
              }
              const payload: UpdateUserPayload = {
                name,
                username: user.username,
                is_admin: user.is_admin,
                ...(password ? { password } : {}),
              };
              setSubmitting(true);
              try {
                await updateUser(user.id, payload);
                toast.success("Cập nhật người dùng thành công");
                await onSaved();
              } catch {
                toast.error("Cập nhật người dùng thất bại");
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-3"
          >
            <fieldset disabled={submitting} className="space-y-3">
              <Field label="Họ và tên" name="name" defaultValue={user.name} required />
              <Field label="Tên đăng nhập" name="username" defaultValue={user.username} disabled />
              <Field
                label="Mật khẩu mới (để trống nếu không đổi)"
                name="password"
                type="password"
              />
            </fieldset>
            <DialogFooter>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {disabled && (
          <span className="ml-1 text-xs font-normal text-slate-400">(không thể sửa)</span>
        )}
      </label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        className={cn(
          "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100",
          disabled && "cursor-not-allowed bg-slate-100 text-slate-500",
        )}
      />
    </div>
  );
}
