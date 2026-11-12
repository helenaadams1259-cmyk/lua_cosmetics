import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { formatVND, discountPercent } from "@/lib/format";
import {
  Minus,
  Plus,
  ShoppingBag,
  Star,
  Check,
  Truck,
  ShieldCheck,
  Zap,
  Heart,
  Flame,
  Sparkles,
  Award,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";
import {
  fetchProductDetail,
  PLACEHOLDER_PRODUCT_IMAGE,
  type ApiProduct,
} from "@/lib/products-api";
import { parseSanPhamSlug, productHref } from "@/lib/products";

export const Route = createFileRoute("/san-pham/$")({
  head: () => ({
    meta: [
      { title: "Chi tiết sản phẩm — Lụa Cosmetics" },
      { name: "description", content: "Thông tin chi tiết sản phẩm mỹ phẩm chính hãng." },
    ],
  }),
  component: ProductDetail,
});

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "notfound" }
  | { status: "ready"; product: ApiProduct };

function ProductDetail() {
  const params = Route.useParams();
  const splat = (params as { _splat?: string })._splat ?? "";
  const parsed = useMemo(() => parseSanPhamSlug(splat), [splat]);

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [tab, setTab] = useState<"description" | "ingredients" | "usage">("description");

  const { add } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!parsed) {
      setState({ status: "notfound" });
      return;
    }
    let cancelled = false;
    setState({ status: "loading" });
    setActiveImg(null);
    fetchProductDetail(parsed.slug, parsed.id)
      .then((product) => {
        if (cancelled) return;
        if (!product || typeof product.id === "undefined") {
          setState({ status: "notfound" });
        } else {
          setState({ status: "ready", product });
          setActiveImg(product.images?.[0] ?? PLACEHOLDER_PRODUCT_IMAGE);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Không thể tải sản phẩm",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [parsed?.slug, parsed?.id]);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-10 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "notfound") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Không tìm thấy sản phẩm</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đường dẫn không hợp lệ hoặc sản phẩm đã bị gỡ.</p>
        <Link to="/san-pham" className="mt-4 inline-block text-primary hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Đã xảy ra lỗi</h1>
        <p className="mt-2 text-sm text-muted-foreground">Không thể tải dữ liệu sản phẩm. Vui lòng thử lại.</p>
        <button
          onClick={() => {
            if (parsed) {
              setState({ status: "loading" });
              fetchProductDetail(parsed.slug, parsed.id)
                .then((product) => setState({ status: "ready", product }))
                .catch((err: unknown) =>
                  setState({
                    status: "error",
                    message: err instanceof Error ? err.message : "Lỗi",
                  }),
                );
            }
          }}
          className="mt-4 rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const product = state.product;
  const gallery = product.images && product.images.length > 0 ? product.images : [PLACEHOLDER_PRODUCT_IMAGE];
  const mainImg = activeImg ?? gallery[0];
  const price = Number(product.price) || 0;
  const original = Number(product.original_price) || 0;
  const oldPrice = original > price ? original : undefined;
  const discount =
    Number(product.discount_percent) > 0
      ? Math.round(Number(product.discount_percent))
      : discountPercent(price, oldPrice);
  const stock = Number(product.stock) || 0;
  const rating = Number(product.rating) || 0;
  const reviewCount = Number(product.review_count) || 0;

  const snapshot = {
    id: String(product.id),
    slug: product.slug ?? "",
    name: product.name,
    price,
    image: gallery[0],
    stock,
  };

  const outOfStock = stock <= 0;
  const effectiveQty = Math.min(Math.max(qty, 1), Math.max(stock, 1));

  const handleAdd = () => {
    if (outOfStock) {
      toast.error("Sản phẩm đã hết hàng.");
      return;
    }
    if (effectiveQty > stock) {
      toast.error("Số lượng yêu cầu vượt quá tồn kho hiện có.");
      return;
    }
    const ok = add(snapshot, effectiveQty);
    if (ok) toast.success(`Đã thêm ${effectiveQty} sản phẩm vào giỏ hàng`);
  };

  const handleBuyNow = () => {
    if (outOfStock) {
      toast.error("Sản phẩm đã hết hàng.");
      return;
    }
    const ok = add(snapshot, effectiveQty);
    if (ok) navigate({ to: "/thanh-toan" });
  };


  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">Trang chủ</Link> /{" "}
        <Link to="/san-pham" className="hover:text-primary">Sản phẩm</Link> /{" "}
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
            <img src={mainImg} alt={product.name} className="h-full w-full object-cover" />
            {discount > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                -{discount}%
              </span>
            )}
            <div className="absolute right-4 top-4 flex flex-col gap-2">
              {product.is_featured ? (
                <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
                  <Flame className="h-3 w-3" /> Nổi bật
                </span>
              ) : null}
              {product.is_best_seller ? (
                <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                  <Award className="h-3 w-3" /> Bán chạy
                </span>
              ) : null}
              {product.is_new ? (
                <span className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                  <Sparkles className="h-3 w-3" /> Mới
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {gallery.map((src, i) => (
              <button
                key={`${src}-${i}`}
                onClick={() => setActiveImg(src)}
                className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                  mainImg === src ? "border-primary" : "border-transparent hover:border-border"
                }`}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
          {product.short_description && (
            <p className="mt-2 text-sm text-muted-foreground">{product.short_description}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`}
                />
              ))}
              <span className="ml-1 font-semibold">{rating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">({reviewCount} đánh giá)</span>
            <span className="text-muted-foreground">|</span>
            <span className={stock > 0 ? "text-green-600" : "text-destructive"}>
              {stock > 0 ? `Còn hàng (${stock})` : "Hết hàng"}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3 rounded-xl bg-secondary/60 p-4">
            <span className="text-3xl font-bold text-primary">{formatVND(price)}</span>
            {oldPrice ? (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatVND(oldPrice)}</span>
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  -{discount}%
                </span>
              </>
            ) : null}
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Meta label="Xuất xứ" value={product.origin} />
            <Meta label="Dung tích" value={product.volume} />
            <Meta label="Loại da" value={product.skin_type} />
            <Meta label="Tồn kho" value={String(stock)} />
          </dl>

          {/* Quantity + Actions */}
          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold">Số lượng</label>
            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex items-center rounded-full border border-border ${outOfStock ? "opacity-50" : ""}`}>
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  disabled={outOfStock}
                  className="grid h-10 w-10 place-items-center rounded-l-full hover:bg-secondary disabled:cursor-not-allowed"
                  aria-label="Giảm"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center text-sm font-semibold">{outOfStock ? 0 : qty}</span>
                <button
                  onClick={() => {
                    if (qty + 1 > stock) {
                      toast.error("Số lượng yêu cầu vượt quá tồn kho hiện có.");
                      return;
                    }
                    setQty(qty + 1);
                  }}
                  disabled={outOfStock || qty >= stock}
                  className="grid h-10 w-10 place-items-center rounded-r-full hover:bg-secondary disabled:cursor-not-allowed"
                  aria-label="Tăng"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => toast.success("Đã lưu vào danh sách yêu thích")}
                className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-secondary"
                aria-label="Yêu thích"
              >
                <Heart className="h-4 w-4" />
              </button>
            </div>

            {outOfStock && (
              <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                Sản phẩm hiện đang hết hàng. Vui lòng quay lại sau.
              </p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleAdd}
                disabled={outOfStock}
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-primary bg-background px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" /> {outOfStock ? "Hết hàng" : "Thêm vào giỏ"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={outOfStock}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="h-4 w-4" /> Mua ngay
              </button>
            </div>
          </div>


          <div className="mt-6 grid gap-2 rounded-xl border border-border p-4 text-sm">
            <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Giao hàng toàn quốc, phí 30.000₫</div>
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Cam kết chính hãng 100%</div>
            <div className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Đổi trả trong vòng 7 ngày</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12">
        <div className="flex flex-wrap gap-2 border-b border-border">
          <TabBtn active={tab === "description"} onClick={() => setTab("description")}>Mô tả sản phẩm</TabBtn>
          <TabBtn active={tab === "ingredients"} onClick={() => setTab("ingredients")}>Thành phần</TabBtn>
          <TabBtn active={tab === "usage"} onClick={() => setTab("usage")}>Hướng dẫn sử dụng</TabBtn>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-sm leading-relaxed text-foreground/90">
          {tab === "description" && (
            <p className="whitespace-pre-line">{product.description || "Chưa có mô tả."}</p>
          )}
          {tab === "ingredients" && (
            <p className="whitespace-pre-line">{product.ingredients || "Chưa có thông tin thành phần."}</p>
          )}
          {tab === "usage" && (
            <p className="whitespace-pre-line">{product.usage || "Chưa có hướng dẫn sử dụng."}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value || "—"}</dd>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
        active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// Re-export for consumers that build product URLs.
export { productHref };
