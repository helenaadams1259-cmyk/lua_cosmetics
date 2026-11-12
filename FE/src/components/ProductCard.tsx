import { Link } from "@tanstack/react-router";
import { Star, ShoppingBag, Eye } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatVND, discountPercent } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const discount = discountPercent(product.price, product.oldPrice);
  const splat = `${product.slug}-${product.id}.html`;
  const stock = typeof product.stock === "number" ? product.stock : 0;
  const outOfStock = stock <= 0;
  const lowStock = !outOfStock && stock <= 5;

  return (
    <div className="group hover-lift flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <Link
        to="/san-pham/$"
        params={{ _splat: splat }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            outOfStock ? "opacity-60 grayscale" : ""
          }`}
        />
        {discount > 0 && !outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
            -{discount}%
          </span>
        )}
        {product.newArrival && !outOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            Mới
          </span>
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2.5 py-1 text-xs font-semibold text-destructive-foreground">
            Hết hàng
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        {product.category && <p className="text-xs text-muted-foreground">{product.category}</p>}
        <Link
          to="/san-pham/$"
          params={{ _splat: splat }}
          className="mt-1 line-clamp-2 min-h-[2.75rem] text-sm font-medium text-foreground hover:text-primary"
        >
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
          <span>{product.rating.toFixed(1)}</span>
          <span className="ml-1">({product.reviewCount})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">{formatVND(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatVND(product.oldPrice)}</span>
          )}
        </div>
        <p
          className={`mt-1 text-xs font-medium ${
            outOfStock ? "text-destructive" : lowStock ? "text-amber-600" : "text-muted-foreground"
          }`}
        >
          {outOfStock
            ? "Hết hàng"
            : lowStock
              ? `Chỉ còn ${stock} sản phẩm`
              : `Còn hàng: ${stock}`}
        </p>
        <div className="mt-3 flex gap-2">
          <Link
            to="/san-pham/$"
            params={{ _splat: splat }}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary"
          >
            <Eye className="h-3.5 w-3.5" /> Xem
          </Link>
          <button
            disabled={outOfStock}
            onClick={() => {
              add({
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                stock,
              });
              if (!outOfStock) toast.success("Đã thêm vào giỏ hàng");
            }}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingBag className="h-3.5 w-3.5" /> {outOfStock ? "Hết" : "Thêm"}
          </button>
        </div>
      </div>
    </div>
  );
}

