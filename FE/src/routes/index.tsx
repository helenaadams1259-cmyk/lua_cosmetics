import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CATEGORIES, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  HeartHandshake,
  Flame,
  ArrowRight,
  Star,
} from "lucide-react";
import { formatVND, discountPercent } from "@/lib/format";
import {
  adaptApiProduct,
  fetchProductHighlights,
  PLACEHOLDER_PRODUCT_IMAGE,
  type ProductHighlights,
} from "@/lib/products-api";

export const Route = createFileRoute("/")({
  component: Home,
});

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ProductHighlights };

function Home() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    fetchProductHighlights()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Không thể tải dữ liệu",
          });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const featured =
    state.status === "ready" ? state.data.featured.slice(0, 4).map(adaptApiProduct) : [];
  const bestSellers =
    state.status === "ready" ? state.data.best_sellers.slice(0, 8).map(adaptApiProduct) : [];
  const newArrivals =
    state.status === "ready" ? state.data.new_arrivals.slice(0, 8).map(adaptApiProduct) : [];
  const newest =
    state.status === "ready" ? state.data.newest.slice(0, 8).map(adaptApiProduct) : [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-soft via-background to-beige">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-6 md:py-24">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Bộ sưu tập mới 2026
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Vẻ đẹp tự nhiên,<br />
              <span className="text-primary">tỏa sáng mỗi ngày</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground">
              Khám phá bộ sưu tập mỹ phẩm chính hãng, dịu nhẹ và an toàn — được yêu thích bởi hàng ngàn khách hàng Việt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/san-pham" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:-translate-y-0.5">
                Mua sắm ngay <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/san-pham" className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary">
                Xem danh mục
              </Link>
            </div>
            <div className="mt-8 flex gap-6 text-sm">
              <div>
                <p className="text-2xl font-bold text-foreground">10K+</p>
                <p className="text-xs text-muted-foreground">Khách hàng</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">500+</p>
                <p className="text-xs text-muted-foreground">Sản phẩm</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">4.9★</p>
                <p className="text-xs text-muted-foreground">Đánh giá</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1000&q=80"
              alt="Bộ sưu tập mỹ phẩm"
              className="mx-auto aspect-square w-full max-w-md rounded-[2rem] object-cover shadow-2xl"
            />
            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl bg-background p-4 shadow-xl md:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đánh giá trung bình</p>
                  <p className="text-sm font-bold">4.9 / 5.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Danh mục nổi bật</h2>
            <p className="mt-1 text-sm text-muted-foreground">Chọn danh mục yêu thích của bạn</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/san-pham"
              search={{ category: c } as never}
              className="hover-lift group flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-4 text-center"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-pink-soft to-beige text-primary transition-transform group-hover:scale-110">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-medium">{c}</p>
            </Link>
          ))}
        </div>
      </section>

      {state.status === "error" && (
        <section className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Không thể tải sản phẩm. Vui lòng thử lại sau.
          </div>
        </section>
      )}

      {/* Featured (Flash Sale layout) */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-primary to-primary/70 p-6 md:p-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-primary-foreground">
              <Flame className="h-7 w-7" />
              <div>
                <h2 className="text-2xl font-bold">Sản phẩm nổi bật</h2>
                <p className="text-sm opacity-90">Ưu đãi giới hạn trong hôm nay</p>
              </div>
            </div>
            <div className="flex gap-2 text-primary-foreground">
              {["02", "45", "18"].map((t, i) => (
                <div key={i} className="grid h-12 w-12 place-items-center rounded-lg bg-background/20 font-bold backdrop-blur">
                  {t}
                </div>
              ))}
            </div>
          </div>
          {state.status === "loading" ? (
            <FlashSaleSkeleton />
          ) : featured.length === 0 ? (
            <EmptyBanner label="Chưa có sản phẩm nổi bật" />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {featured.map((p) => (
                <Link
                  to="/san-pham/$"
                  params={{ _splat: `${p.slug}-${p.id}.html` }}
                  key={p.id}
                  className="hover-lift overflow-hidden rounded-2xl bg-card"
                >
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 min-h-[2.5rem] text-xs font-medium">{p.name}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-sm font-bold text-primary">{formatVND(p.price)}</span>
                      {p.oldPrice && <span className="text-xs text-muted-foreground line-through">{formatVND(p.oldPrice)}</span>}
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-2/3 rounded-full bg-primary" />
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Giảm {discountPercent(p.price, p.oldPrice)}%
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Best Sellers */}
      <ProductSection
        title="Sản phẩm bán chạy"
        subtitle="Được yêu thích nhất"
        status={state.status}
        products={bestSellers}
        emptyLabel="Chưa có sản phẩm bán chạy"
      />

      {/* New Arrivals */}
      <ProductSection
        title="Sản phẩm mới"
        subtitle="Vừa cập bến, đừng bỏ lỡ"
        status={state.status}
        products={newArrivals}
        emptyLabel="Chưa có sản phẩm mới"
      />

      {/* Newest */}
      <ProductSection
        title="Mới cập nhật"
        subtitle="Những sản phẩm vừa được thêm gần đây"
        status={state.status}
        products={newest}
        emptyLabel="Chưa có sản phẩm cập nhật"
      />

      {/* Why Choose Us */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Vì sao chọn Lụa Cosmetics?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cam kết mang đến trải nghiệm mua sắm tốt nhất</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: ShieldCheck, t: "Chính hãng 100%", d: "Cam kết sản phẩm chính hãng, hoàn tiền gấp đôi nếu phát hiện hàng giả." },
            { icon: Truck, t: "Giao hàng toàn quốc", d: "Miễn phí vận chuyển với đơn hàng từ 500.000₫." },
            { icon: HeartHandshake, t: "Đổi trả trong 7 ngày", d: "Chính sách đổi trả linh hoạt, dễ dàng." },
            { icon: Sparkles, t: "Ưu đãi hấp dẫn", d: "Nhiều chương trình khuyến mãi mỗi tuần." },
          ].map((f) => (
            <div key={f.t} className="hover-lift rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                <f.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold md:text-3xl">Khách hàng nói gì về chúng tôi</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "Nguyễn Thu Hằng", c: "TP. Hồ Chí Minh", t: "Sản phẩm chất lượng, đóng gói cẩn thận, giao hàng nhanh. Da mình cải thiện rõ sau 2 tuần dùng serum." },
            { n: "Trần Minh Anh", c: "Hà Nội", t: "Giá cả hợp lý, tư vấn tận tình. Mình đã mua nhiều lần và luôn hài lòng." },
            { n: "Lê Phương Linh", c: "Đà Nẵng", t: "Shop uy tín, sản phẩm chính hãng. Sẽ tiếp tục ủng hộ dài dài." },
          ].map((r) => (
            <div key={r.n} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex gap-1 text-primary">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">"{r.t}"</p>
              <div className="mt-4">
                <p className="text-sm font-semibold">{r.n}</p>
                <p className="text-xs text-muted-foreground">{r.c}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductSection({
  title,
  subtitle,
  status,
  products,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  status: State["status"];
  products: Product[];
  emptyLabel: string;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link to="/san-pham" className="text-sm font-medium text-primary hover:underline">Xem tất cả →</Link>
      </div>
      {status === "loading" ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <EmptyBanner label={emptyLabel} />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FlashSaleSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl bg-card">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="space-y-2 p-3">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyBanner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 py-10 text-center">
      <img
        src={PLACEHOLDER_PRODUCT_IMAGE}
        alt=""
        className="h-16 w-16 rounded-full object-cover opacity-60"
      />
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

