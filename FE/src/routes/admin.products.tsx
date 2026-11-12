import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUrlList, sanitizeImageUrls } from "@/components/admin/ImageUrlList";
import { getAuthToken } from "@/lib/auth-api";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  slugifyVN,
  bulkUploadProductsCsv,
  downloadProductsCsvTemplate,
  type ApiProduct,
  type ProductPayload,
} from "@/lib/products-api";
import { formatVND } from "@/lib/format";
import { Search, Plus, Pencil, Trash2, Star, Loader2, Upload, FileText, X, Download } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPublicBrands,
  fetchPublicCategories,
  type PublicBrand,
  type PublicCategory,
} from "@/lib/public-catalog-api";
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
import { Pagination } from "./admin.users";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export const Route = createFileRoute("/admin/products")({
  component: ProductsPage,
});

function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [brands, setBrands] = useState<PublicBrand[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 400);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editing, setEditing] = useState<ApiProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ApiProduct | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = async (
    p = page,
    ps = pageSize,
    term = debouncedQ,
    cat = categoryFilter,
    br = brandFilter,
  ) => {
    setLoading(true);
    try {
      const res = await fetchProducts({
        page: p,
        pageSize: ps,
        q: term,
        category_id: cat || undefined,
        brand_id: br || undefined,
      });
      setProducts(res.data);
      setTotal(res.total);
      setMaxPage(Math.max(1, res.maxPage));
    } catch {
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!getAuthToken()) {
      navigate({ to: "/admin/login" });
      return;
    }
    load(page, pageSize, debouncedQ, categoryFilter, brandFilter);
  }, [page, pageSize, debouncedQ, categoryFilter, brandFilter]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, categoryFilter, brandFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoadingOptions(true);
    Promise.all([fetchPublicCategories(), fetchPublicBrands()])
      .then(([cats, brs]) => {
        if (cancelled) return;
        setCategories(cats);
        setBrands(brs);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải danh mục hoặc thương hiệu.");
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryName = (id: number) =>
    categories.find((c) => c.id === id)?.name || `#${id}`;
  const brandName = (id: number) => brands.find((b) => b.id === id)?.name || `#${id}`;

  const filtered = products;

  const confirmDelete = async () => {
    if (!deleting || deletingBusy) return;
    setDeletingBusy(true);
    try {
      await deleteProduct(deleting.id);
      toast.success("Đã xóa sản phẩm.");
      setDeleting(null);
      await load();
    } catch {
      toast.error("Xóa sản phẩm thất bại.");
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <AdminShell title="Quản lý sản phẩm">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2 md:flex-row">
            <div className="relative md:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Tất cả thương hiệu</option>
              {brands.map((b) => (
                <option key={b.id} value={String(b.id)}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBulkOpen(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50 disabled:opacity-50"
            >
              <Upload className="h-4 w-4" /> Tải lên CSV
            </button>
            <button
              onClick={() => setCreating(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Thêm sản phẩm
            </button>
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Ảnh</th>
                <th className="px-4 py-3">Tên sản phẩm</th>
                <th className="px-4 py-3">Danh mục</th>
                <th className="px-4 py-3">Thương hiệu</th>
                <th className="px-4 py-3">Giá</th>
                <th className="px-4 py-3">Kho</th>
                <th className="px-4 py-3">Đánh giá</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-pink-600" />
                      <span>Đang tải danh sách sản phẩm...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                    Không tìm thấy sản phẩm
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <img
                        src={p.images?.[0] || ""}
                        alt={p.name}
                        className="h-11 w-11 rounded-md object-cover"
                      />
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <div className="truncate font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">#{p.id}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{categoryName(p.category_id)}</td>
                    <td className="px-4 py-3 text-slate-600">{brandName(p.brand_id)}</td>
                    <td className="px-4 py-3 font-semibold text-pink-600">
                      {formatVND(p.price)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.stock}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-slate-700">{p.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-medium " +
                          (p.stock > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500")
                        }
                      >
                        {p.stock > 0 ? "Đang bán" : "Hết hàng"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => setEditing(p)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleting(p)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
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

      <ProductFormDialog
        open={creating || !!editing}
        mode={editing ? "edit" : "create"}
        initial={editing}
        categories={categories}
        brands={brands}
        loadingOptions={loadingOptions}
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
            <AlertDialogTitle>Xác nhận xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa <strong>{deleting?.name}</strong>?
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

      <BulkCsvDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={async () => {
          setBulkOpen(false);
          await load();
        }}
      />
    </AdminShell>
  );
}

function BulkCsvDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void | Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<import("@/lib/products-api").BulkCsvResult | null>(null);

  const handleDownloadTemplate = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadProductsCsvTemplate();
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Không thể tải file mẫu. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      setFile(null);
      setResult(null);
    }
  }, [open]);

  const handleFile = (f: File | null) => {
    setResult(null);
    if (!f) {
      setFile(null);
      return;
    }
    const isCsv =
      f.type === "text/csv" ||
      f.type === "application/vnd.ms-excel" ||
      f.name.toLowerCase().endsWith(".csv");
    if (!isCsv) {
      toast.error("Chỉ chấp nhận file .csv");
      return;
    }
    if (f.size === 0) {
      toast.error("File CSV đang trống.");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Vui lòng chọn file CSV.");
      return;
    }
    if (file.size === 0) {
      toast.error("File CSV đang trống.");
      return;
    }
    setUploading(true);
    setResult(null);
    try {
      const res = await bulkUploadProductsCsv(file);
      setResult(res);
      const imported = res?.imported_rows ?? 0;
      const failed = res?.failed_rows ?? 0;
      if (imported > 0 && failed === 0) {
        toast.success(`Đã nhập thành công ${imported} sản phẩm.`);
      } else if (imported > 0 && failed > 0) {
        toast.warning(`Nhập ${imported} sản phẩm, ${failed} dòng lỗi.`);
      } else if (imported === 0 && failed > 0) {
        toast.error(`Nhập thất bại: ${failed} dòng lỗi.`);
      } else {
        toast.success("Đã xử lý file CSV.");
      }
      if (imported > 0) {
        await onImported();
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : "Tải lên CSV thất bại. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !uploading && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tải lên sản phẩm từ CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Chọn file <strong>.csv</strong> chứa danh sách sản phẩm để nhập hàng loạt.
          </p>

          <div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải...
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" /> Tải file CSV mẫu
                </>
              )}
            </button>
          </div>

          <label
            className={
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors " +
              (uploading
                ? "border-slate-200 bg-slate-50 opacity-60"
                : "border-slate-300 hover:border-pink-400 hover:bg-pink-50/40")
            }
          >
            <Upload className="h-6 w-6 text-slate-400" />
            <div className="text-sm font-medium text-slate-700">
              Bấm để chọn file CSV
            </div>
            <div className="text-xs text-slate-500">Chỉ chấp nhận định dạng .csv</div>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={uploading}
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {file && (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-pink-600" />
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-800">{file.name}</div>
                  <div className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                disabled={uploading}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                aria-label="Xóa file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {result && (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <span className="text-slate-600">
                  Tổng: <strong className="text-slate-800">{result.total_rows}</strong>
                </span>
                <span className="text-emerald-700">
                  Thành công: <strong>{result.imported_rows}</strong>
                </span>
                <span className="text-rose-700">
                  Lỗi: <strong>{result.failed_rows}</strong>
                </span>
              </div>
              {result.errors && result.errors.length > 0 && (
                <div className="max-h-48 overflow-auto rounded-md border border-rose-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-rose-50 text-rose-700">
                      <tr>
                        <th className="px-2 py-1.5 font-semibold w-16">Dòng</th>
                        <th className="px-2 py-1.5 font-semibold">Lỗi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.errors.map((e, i) => (
                        <tr key={i} className="border-t border-rose-100">
                          <td className="px-2 py-1.5 align-top font-mono text-slate-700">
                            {e.row_number}
                          </td>
                          <td className="px-2 py-1.5 align-top text-rose-700">
                            {e.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>


        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải lên...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Tải lên
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function ProductFormDialog({
  open,
  mode,
  initial,
  categories,
  brands,
  loadingOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial: ApiProduct | null;
  categories: PublicCategory[];
  brands: PublicBrand[];
  loadingOptions: boolean;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [brandId, setBrandId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setImages(initial.images || []);
      setCategoryId(String(initial.category_id || ""));
      setBrandId(String(initial.brand_id || ""));
    } else {
      setImages([]);
      setCategoryId("");
      setBrandId("");
    }
  }, [open, mode, initial]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}
          </DialogTitle>
        </DialogHeader>
        <form
          key={initial?.id ?? "new"}
          onSubmit={async (e) => {
            e.preventDefault();
            if (submitting) return;
            const cleanUrls = sanitizeImageUrls(images);
            if (cleanUrls.length === 0) {
              toast.error("Vui lòng nhập ít nhất một URL ảnh hợp lệ.");
              return;
            }
            if (!categoryId || !brandId) {
              toast.error("Vui lòng chọn danh mục và thương hiệu.");
              return;
            }
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("name") || "").trim();
            const slug = String(fd.get("slug") || "").trim() || slugifyVN(name);
            const payload: ProductPayload = {
              category_id: Number(categoryId),
              brand_id: Number(brandId),
              name,
              slug,
              short_description: String(fd.get("short_description") || ""),
              description: String(fd.get("description") || ""),
              ingredients: String(fd.get("ingredients") || ""),
              usage: String(fd.get("usage") || ""),
              origin: String(fd.get("origin") || ""),
              skin_type: String(fd.get("skin_type") || ""),
              volume: String(fd.get("volume") || ""),
              price: Number(fd.get("price") || 0),
              original_price: Number(fd.get("original_price") || 0),
              stock: Number(fd.get("stock") || 0),
              rating: Number(fd.get("rating") || 0),
              review_count: Number(fd.get("review_count") || 0),
              discount_percent: Number(fd.get("discount_percent") || 0),
              images: cleanUrls,
              is_featured: fd.get("is_featured") === "on" ? 1 : 0,
              is_best_seller: fd.get("is_best_seller") === "on" ? 1 : 0,
              is_new: fd.get("is_new") === "on" ? 1 : 0,
            };
            setSubmitting(true);
            try {
              if (mode === "edit" && initial) {
                await updateProduct(initial.id, payload);
                toast.success("Cập nhật sản phẩm thành công.");
              } else {
                await createProduct(payload);
                toast.success("Thêm sản phẩm thành công.");
              }
              await onSaved();
            } catch {
              toast.error(
                mode === "edit" ? "Cập nhật sản phẩm thất bại." : "Thêm sản phẩm thất bại.",
              );
            } finally {
              setSubmitting(false);
            }
          }}
          className="space-y-3"
        >
          <fieldset disabled={submitting} className="space-y-3">
            <Row>
              <FInput label="Tên sản phẩm" name="name" defaultValue={initial?.name} required />
            </Row>
            <Row>
              <FInput label="Slug" name="slug" defaultValue={initial?.slug} />
              <FInput label="Dung tích" name="volume" defaultValue={initial?.volume} />
            </Row>
            <Row>
              <FOptionSelect
                label="Danh mục"
                value={categoryId}
                onChange={setCategoryId}
                options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
                loading={loadingOptions}
                required
              />
              <FOptionSelect
                label="Thương hiệu"
                value={brandId}
                onChange={setBrandId}
                options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
                loading={loadingOptions}
                required
              />
            </Row>
            <Row>
              <FInput
                label="Giá bán (₫)"
                name="price"
                type="number"
                defaultValue={initial?.price ?? 0}
                required
              />
              <FInput
                label="Giá gốc (₫)"
                name="original_price"
                type="number"
                defaultValue={initial?.original_price ?? 0}
              />
            </Row>
            <Row>
              <FInput
                label="Số lượng kho"
                name="stock"
                type="number"
                defaultValue={initial?.stock ?? 0}
              />
              <FInput
                label="Giảm giá (%)"
                name="discount_percent"
                type="number"
                defaultValue={initial?.discount_percent ?? 0}
              />
            </Row>
            <Row>
              <FInput label="Xuất xứ" name="origin" defaultValue={initial?.origin} />
              <FInput label="Loại da" name="skin_type" defaultValue={initial?.skin_type} />
            </Row>
            <Row>
              <FInput
                label="Đánh giá (0-5)"
                name="rating"
                type="number"
                step="0.1"
                defaultValue={initial?.rating ?? 0}
              />
              <FInput
                label="Số lượt đánh giá"
                name="review_count"
                type="number"
                defaultValue={initial?.review_count ?? 0}
              />
            </Row>
            <FTextarea
              label="Mô tả ngắn"
              name="short_description"
              defaultValue={initial?.short_description}
            />
            <FTextarea label="Mô tả" name="description" defaultValue={initial?.description} />
            <FTextarea
              label="Thành phần"
              name="ingredients"
              defaultValue={initial?.ingredients}
            />
            <FTextarea label="Hướng dẫn sử dụng" name="usage" defaultValue={initial?.usage} />
            <ImageUrlList value={images} onChange={setImages} />
            <div className="flex flex-wrap gap-4 pt-2">
              <Check
                label="Sản phẩm nổi bật"
                name="is_featured"
                defaultChecked={!!initial?.is_featured}
              />
              <Check
                label="Bán chạy"
                name="is_best_seller"
                defaultChecked={!!initial?.is_best_seller}
              />
              <Check label="Hàng mới" name="is_new" defaultChecked={!!initial?.is_new} />
            </div>
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
              disabled={submitting || loadingOptions}
              className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
            >
              {(submitting || loadingOptions) && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Đang lưu..." : "Lưu"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 md:grid-cols-2">{children}</div>;
}
function FInput({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
      />
    </div>
  );
}
function FTextarea({
  label,
  name,
  defaultValue,
  rows = 3,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100"
      />
    </div>
  );
}
function FOptionSelect({
  label,
  value,
  onChange,
  options,
  loading,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  loading?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={loading}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
        >
          <option value="">{loading ? "Đang tải..." : "-- Chọn --"}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {loading && (
          <Loader2 className="pointer-events-none absolute right-8 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>
    </div>
  );
}
function Check({
  label,
  name,
  defaultChecked,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded" />
      {label}
    </label>
  );
}
