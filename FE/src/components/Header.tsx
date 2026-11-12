import { Link } from "@tanstack/react-router";
import { ShoppingBag, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useNavigate } from "@tanstack/react-router";
import { AccountMenu } from "@/components/AccountMenu";

export function Header() {
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/san-pham", search: { q: q || undefined } as never });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground font-display text-lg">
            L
          </div>
          <span className="font-display text-xl font-bold text-foreground">Lụa Cosmetics</span>
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          <Link to="/" activeProps={{ className: "text-primary font-semibold" }} activeOptions={{ exact: true }} className="text-sm font-medium text-foreground hover:text-primary">
            Trang chủ
          </Link>
          <Link to="/san-pham" activeProps={{ className: "text-primary font-semibold" }} className="text-sm font-medium text-foreground hover:text-primary">
            Sản phẩm
          </Link>
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-sm flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full rounded-full border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm outline-none focus:border-primary focus:bg-background"
            />
          </div>
        </form>

        <Link to="/gio-hang" className="relative ml-auto md:ml-0 inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium hover:bg-secondary">
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Giỏ hàng</span>
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {totalItems}
            </span>
          )}
        </Link>

        <AccountMenu />

        <button onClick={() => setOpen(!open)} className="md:hidden">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="flex flex-col gap-2 p-4">
            <form onSubmit={submitSearch} className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full rounded-full border border-border bg-secondary/50 py-2 pl-10 pr-4 text-sm"
              />
            </form>
            <Link to="/" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Trang chủ</Link>
            <Link to="/san-pham" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-secondary">Sản phẩm</Link>
          </div>
        </div>
      )}
    </header>
  );
}
