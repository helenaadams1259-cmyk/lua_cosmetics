import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAuthToken } from "@/lib/auth-api";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type ApiCategory,
  type CategoryPayload,
} from "@/lib/categories-api";
import { Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { Field, Pagination } from "./admin.users";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});



const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 400);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ApiCategory | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const load = async (p = page, ps = pageSize, term = debouncedQ) => {
    setLoading(true);
    try {
      const res = await fetchCategories({ page: p, pageSize: ps, q: term });
      setCategories(res.data);
      setTotal(res.total);
      setMaxPage(Math.max(1, res.maxPage));
    } catch {
      toast.error("Không thể tải danh sách danh mục.");
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

  const filtered = categories;

  const confirmDelete = async () => {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      await deleteCategory(deleting.id);
      toast.success("Xóa danh mục thành công.");
      setDeleting(null);
      await load();
    } catch {
      toast.error("Xóa danh mục thất bại.");
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <AdminShell title="Quản lý danh mục">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm danh mục..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Thêm danh mục
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tên danh mục</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                      <span>Đang tải danh sách danh mục...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    Không có danh mục nào
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.id}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-slate-600">{c.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(c)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                          title="Sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(c)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
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

      <CategoryFormDialog
        open={creating || !!editing}
        mode={editing ? "edit" : "create"}
        initial={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={async () => {
          setCreating(false);
          setEditing(null);
          await load();
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && !deletingBusy && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh mục này?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingBusy}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deletingBusy}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              {deletingBusy ? (
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

function CategoryFormDialog({
  open,
  mode,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial: ApiCategory | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Chỉnh sửa danh mục" : "Thêm danh mục"}</DialogTitle>
        </DialogHeader>
        <form
          key={initial?.id ?? "new"}
          onSubmit={async (e) => {
            e.preventDefault();
            if (submitting) return;
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") || "").trim();
            const slug = String(fd.get("slug") || "").trim() || slugify(name);
            const payload: CategoryPayload = { name, slug };
            setSubmitting(true);
            try {
              if (mode === "edit" && initial) {
                await updateCategory(initial.id, payload);
                toast.success("Cập nhật danh mục thành công.");
              } else {
                await createCategory(payload);
                toast.success("Thêm danh mục thành công.");
              }
              await onSaved();
            } catch {
              toast.error(
                mode === "edit" ? "Cập nhật danh mục thất bại." : "Thêm danh mục thất bại.",
              );
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <fieldset disabled={submitting} className="space-y-3">
            <Field label="Tên danh mục" name="name" defaultValue={initial?.name} required />
            <Field label="Slug" name="slug" defaultValue={initial?.slug} />
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
