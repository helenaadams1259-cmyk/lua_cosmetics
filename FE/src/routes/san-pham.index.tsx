import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

import { ProductCard } from "@/components/ProductCard";
import { adaptApiProduct, fetchProductFilter, type ApiProduct } from "@/lib/products-api";
import {
  fetchPublicBrands,
  fetchPublicCategories,
  type PublicBrand,
  type PublicCategory,
} from "@/lib/public-catalog-api";
import { Loader2 } from "lucide-react";
import { formatVND } from "@/lib/format";

const searchSchema = z.object({
  slug: z.string().catch("").default(""),
  min_price: z.number().catch(0).default(0),
  max_price: z.number().catch(0).default(0),
  brands: z.string().catch("").default(""),
  q: z.string().catch("").default(""),
  page: z.number().int().catch(1).default(1),
  page_size: z.number().int().catch(12).default(12),
});

export const Route = createFileRoute("/san-pham/")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sản phẩm — Lụa Cosmetics" },
      {
        name: "description",
        content:
          "Danh mục mỹ phẩm chính hãng: kem chống nắng, serum, son môi, cushion và nhiều hơn nữa.",
      },
    ],
  }),
  component: ProductList,
});

function parseBrandIds(s: string): number[] {
  if (!s) return [];
  return s
    .split(",")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function ProductList() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [brands, setBrands] = useState<PublicBrand[]>([]);
  const [catLoading, setCatLoading] = useState(true);
  const [brandLoading, setBrandLoading] = useState(true);

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [maxPage, setMaxPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [minInput, setMinInput] = useState<string>(search.min_price ? String(search.min_price) : "");
  const [maxInput, setMaxInput] = useState<string>(search.max_price ? String(search.max_price) : "");

  useEffect(() => {
    setMinInput(search.min_price ? String(search.min_price) : "");
    setMaxInput(search.max_price ? String(search.max_price) : "");
  }, [search.min_price, search.max_price]);

  useEffect(() => {
    let cancelled = false;
    setCatLoading(true);
    fetchPublicCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      })
      .finally(() => {
        if (!cancelled) setCatLoading(false);
      });
    setBrandLoading(true);
    fetchPublicBrands()
      .then((list) => {
        if (!cancelled) setBrands(list);
      })
      .catch(() => {
        if (!cancelled) setBrands([]);
      })
      .finally(() => {
        if (!cancelled) setBrandLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const brandIds = parseBrandIds(search.brands);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchProductFilter({
      slug: search.slug || undefined,
      min_price: search.min_price > 0 ? search.min_price : undefined,
      max_price: search.max_price > 0 ? search.max_price : undefined,
      brands: brandIds.length > 0 ? brandIds : undefined,
      q: search.q || undefined,
      page: search.page,
      page_size: search.page_size,
    })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data);
        setTotal(res.total);
        setMaxPage(Math.max(1, res.maxPage));
      })
      .catch(() => {
        if (cancelled) return;
        setError("Không tải được danh sách sản phẩm. Vui lòng thử lại.");
        setProducts([]);
        setTotal(0);
        setMaxPage(1);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search.slug, search.min_price, search.max_price, search.brands, search.q, search.page, search.page_size]);

  const update = (patch: Partial<z.infer<typeof searchSchema>>, resetPage = true) =>
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        ...patch,
        ...(resetPage && !("page" in patch) ? { page: 1 } : {}),
      }),
    });

  const toggleBrand = (id: number) => {
    const set = new Set(brandIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    update({ brands: Array.from(set).join(",") });
  };

  const applyPrice = () => {
    const min = Number(minInput);
    const max = Number(maxInput);
    update({
      min_price: Number.isFinite(min) && min > 0 ? min : 0,
      max_price: Number.isFinite(max) && max > 0 ? max : 0,
    });
  };

  const clearFilters = () => {
    navigate({ search: { slug: "", min_price: 0, max_price: 0, brands: "", q: "", page: 1, page_size: search.page_size } });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Tất cả sản phẩm</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} sản phẩm</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 h-fit">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold">Danh mục</label>
              {catLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            <div className="space-y-1">
              <button
                onClick={() => update({ slug: "" })}
                className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${!search.slug ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
              >
                Tất cả
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => update({ slug: c.slug ?? "" })}
                  className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${search.slug === c.slug ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold">Thương hiệu</label>
              {brandLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {brands.map((b) => {
                const checked = brandIds.includes(b.id);
                return (
                  <label
                    key={b.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-secondary"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBrand(b.id)}
                      className="h-4 w-4 rounded border-border"
                    />
                    <span>{b.name}</span>
                  </label>
                );
              })}
              {!brandLoading && brands.length === 0 && (
                <p className="text-xs text-muted-foreground">Không có thương hiệu.</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Khoảng giá</label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Từ"
                value={minInput}
                onChange={(e) => setMinInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                type="number"
                placeholder="Đến"
                value={maxInput}
                onChange={(e) => setMaxInput(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={applyPrice}
              className="mt-2 w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Áp dụng
            </button>
            {(search.min_price > 0 || search.max_price > 0) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {search.min_price > 0 ? formatVND(search.min_price) : "0"} —{" "}
                {search.max_price > 0 ? formatVND(search.max_price) : "∞"}
              </p>
            )}
          </div>

          <button
            onClick={clearFilters}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Xoá bộ lọc
          </button>
        </aside>

        <div>
          {error && (
            <div className="mb-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Đang tải sản phẩm...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              Không tìm thấy sản phẩm phù hợp.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={adaptApiProduct(p)} />
                ))}
              </div>

              {maxPage > 1 && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    disabled={search.page <= 1}
                    onClick={() => update({ page: search.page - 1 }, false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Trang {search.page} / {maxPage}
                  </span>
                  <button
                    disabled={search.page >= maxPage}
                    onClick={() => update({ page: search.page + 1 }, false)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
