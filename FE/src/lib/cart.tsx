import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type CartProduct = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  category?: string;
  stock?: number;
};

export type CartItem = {
  product: CartProduct;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  add: (product: CartProduct, qty?: number) => boolean;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => boolean;
  clear: () => void;
  totalItems: number;
  subtotal: number;
  detailed: Array<{ product: CartProduct; quantity: number; subtotal: number }>;
  hasStockIssue: boolean;
};

const CartContext = createContext<CartContextType | null>(null);
const KEY = "cosmetic_cart_v2";

type LegacyItem = { id: string; quantity: number };

function normalize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  const items: CartItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Partial<CartItem> & Partial<LegacyItem>;
    if (e.product && typeof e.product === "object" && typeof e.quantity === "number") {
      items.push({ product: e.product as CartProduct, quantity: e.quantity });
    }
  }
  return items;
}

function readStoredCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? normalize(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredCart);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (product: CartProduct, qty = 1): boolean => {
    const stock = typeof product.stock === "number" ? product.stock : Infinity;
    if (stock <= 0) {
      toast.error("Sản phẩm đã hết hàng.");
      return false;
    }
    let ok = true;
    setItems((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      const currentQty = ex?.quantity ?? 0;
      const requested = currentQty + qty;
      if (requested > stock) {
        ok = false;
        const capped = Math.max(stock, 0);
        toast.error("Số lượng yêu cầu vượt quá tồn kho hiện có.");
        if (ex) {
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, quantity: capped, product: { ...product } } : i,
          );
        }
        return capped > 0 ? [...prev, { product: { ...product }, quantity: capped }] : prev;
      }
      if (ex) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: requested, product: { ...product } } : i,
        );
      }
      return [...prev, { product: { ...product }, quantity: qty }];
    });
    return ok;
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.product.id !== id));

  const setQty = (id: string, qty: number): boolean => {
    let ok = true;
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.product.id !== id);
      return prev.map((i) => {
        if (i.product.id !== id) return i;
        const stock = typeof i.product.stock === "number" ? i.product.stock : Infinity;
        if (qty > stock) {
          ok = false;
          toast.error("Số lượng yêu cầu vượt quá tồn kho hiện có.");
          return { ...i, quantity: Math.max(stock, 0) };
        }
        return { ...i, quantity: qty };
      });
    });
    return ok;
  };

  const clear = () => setItems([]);

  const detailed = items.map((i) => ({
    product: i.product,
    quantity: i.quantity,
    subtotal: i.product.price * i.quantity,
  }));

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = detailed.reduce((s, d) => s + d.subtotal, 0);
  const hasStockIssue = items.some((i) => {
    const s = typeof i.product.stock === "number" ? i.product.stock : Infinity;
    return i.quantity > s || s <= 0;
  });

  return (
    <CartContext.Provider
      value={{ items, add, remove, setQty, clear, totalItems, subtotal, detailed, hasStockIssue }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
