import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/lib/cart";
import { formatVND } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/gio-hang")({
  head: () => ({ meta: [{ title: "Giỏ hàng — Lụa Cosmetics" }] }),
  component: Cart,
});

function Cart() {
  const { detailed, setQty, remove, clear, subtotal, hasStockIssue } = useCart();


  if (detailed.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-secondary text-muted-foreground">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Giỏ hàng đang trống</h1>
        <p className="mt-2 text-muted-foreground">Hãy khám phá bộ sưu tập mỹ phẩm của chúng tôi.</p>
        <Link to="/san-pham" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Mua sắm ngay <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-3xl font-bold">Giỏ hàng của bạn</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {detailed.map(({ product, quantity, subtotal }) => {
            const stock = typeof product.stock === "number" ? product.stock : Infinity;
            const exceeds = quantity > stock;
            const outOfStock = stock <= 0;
            const atMax = Number.isFinite(stock) && quantity >= stock;
            return (
            <div key={product.id} className={`rounded-2xl border bg-card p-4 ${exceeds || outOfStock ? "border-destructive" : "border-border"}`}>
            <div className="grid grid-cols-[80px_1fr_auto] items-center gap-4 sm:grid-cols-[100px_1fr_auto_auto]">
              <Link to="/san-pham/$" params={{ _splat: `${product.slug}-${product.id}.html` }} className="aspect-square overflow-hidden rounded-lg bg-muted">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0">
                <Link to="/san-pham/$" params={{ _splat: `${product.slug}-${product.id}.html` }} className="line-clamp-2 text-sm font-medium hover:text-primary">
                  {product.name}
                </Link>
                <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>
                <p className="mt-1 text-sm font-semibold text-primary sm:hidden">{formatVND(product.price)}</p>
              </div>
              <p className="hidden text-sm font-semibold text-primary sm:block">{formatVND(product.price)}</p>
              <div className="col-span-3 flex items-center justify-between gap-3 sm:col-span-1">
                <div className="flex items-center rounded-full border border-border">
                  <button onClick={() => setQty(product.id, quantity - 1)} className="grid h-8 w-8 place-items-center hover:bg-secondary rounded-l-full">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQty(product.id, quantity + 1)}
                    disabled={outOfStock || atMax}
                    className="grid h-8 w-8 place-items-center rounded-r-full hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm font-bold text-foreground">{formatVND(subtotal)}</p>
                <button onClick={() => remove(product.id)} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {(exceeds || outOfStock) && (
              <p className="mt-2 text-xs font-medium text-destructive">
                {outOfStock
                  ? "Sản phẩm đã hết hàng. Vui lòng xóa khỏi giỏ."
                  : `Số lượng vượt quá tồn kho (còn ${stock}). Vui lòng cập nhật.`}
              </p>
            )}
            </div>
            );
          })}
          <button onClick={clear} className="text-sm text-muted-foreground hover:text-destructive">
            Xóa toàn bộ giỏ hàng
          </button>

        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Tóm tắt đơn hàng</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span className="font-semibold">{formatVND(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phí vận chuyển</span>
              <span>Tính ở bước sau</span>
            </div>
            <div className="my-3 border-t border-border" />
            <div className="flex justify-between text-base">
              <span className="font-semibold">Tổng cộng</span>
              <span className="font-bold text-primary">{formatVND(subtotal)}</span>
            </div>
          </div>
          {hasStockIssue && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              Một số sản phẩm trong giỏ đã vượt quá tồn kho hoặc hết hàng. Vui lòng cập nhật giỏ trước khi thanh toán.
            </p>
          )}
          {hasStockIssue ? (
            <button
              disabled
              className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground opacity-50"
            >
              Tiến hành thanh toán <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link to="/thanh-toan" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Tiến hành thanh toán <ArrowRight className="h-4 w-4" />
            </Link>
          )}

          <Link to="/san-pham" className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:bg-secondary">
            Tiếp tục mua sắm
          </Link>
        </aside>
      </div>
    </div>
  );
}
