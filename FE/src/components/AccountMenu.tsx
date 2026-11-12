import { Link, useNavigate } from "@tanstack/react-router";
import { Gift, KeyRound, LogOut, Package, User, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { tierLabel } from "@/lib/customer-api";
import { useCustomerAuth } from "@/lib/customer-auth";

const MENU_LINKS = [
  { to: "/tai-khoan", label: "Tài khoản của tôi", icon: UserRound },
  { to: "/tai-khoan/don-hang", label: "Đơn hàng của tôi", icon: Package },
  { to: "/tai-khoan/uu-dai", label: "Ưu đãi của tôi", icon: Gift },
  { to: "/tai-khoan/doi-mat-khau", label: "Đổi mật khẩu", icon: KeyRound },
] as const;

function shortName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return parts.slice(-2).join(" ");
}

export function AccountMenu() {
  const { user, logout } = useCustomerAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    toast.success("Đã đăng xuất");
    navigate({ to: "/" });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        data-testid="account-button"
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition hover:bg-secondary ${open ? "border-primary bg-secondary" : "border-border"}`}
      >
        <User className="h-4 w-4" />
        <span className="hidden max-w-[9rem] truncate sm:inline">
          {user ? shortName(user.name) : "Tài khoản"}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-card p-4 shadow-xl"
        >
          {user ? (
            <>
              <div className="border-b border-border pb-3">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="mt-0.5 text-xs text-primary">{tierLabel(user.membership.tier)}</p>
              </div>
              <nav className="mt-2 flex flex-col">
                {MENU_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-secondary"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex items-center gap-2.5 rounded-lg border-t border-border px-2 py-2 pt-3 text-left text-sm text-destructive hover:bg-destructive/5"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </nav>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Chào mừng bạn đến với Lụa</p>
              <Link
                to="/dang-nhap"
                onClick={() => setOpen(false)}
                className="mt-3 flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Đăng nhập
              </Link>
              <Link
                to="/dang-ky"
                onClick={() => setOpen(false)}
                className="mt-2 flex w-full items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
