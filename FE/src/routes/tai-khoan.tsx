import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Gift, KeyRound, Loader2, LogOut, Package, UserRound } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { tierLabel } from "@/lib/customer-api";
import { useCustomerAuth } from "@/lib/customer-auth";

export const Route = createFileRoute("/tai-khoan")({
  head: () => ({ meta: [{ title: "Tài khoản của tôi — Lụa Cosmetics" }] }),
  component: AccountLayout,
});

const NAV_ITEMS = [
  { to: "/tai-khoan", label: "Thông tin tài khoản", icon: UserRound, exact: true },
  { to: "/tai-khoan/don-hang", label: "Đơn hàng của tôi", icon: Package, exact: false },
  { to: "/tai-khoan/uu-dai", label: "Ưu đãi của tôi", icon: Gift, exact: false },
  { to: "/tai-khoan/doi-mat-khau", label: "Đổi mật khẩu", icon: KeyRound, exact: false },
] as const;

function AccountLayout() {
  const { user, loading, logout } = useCustomerAuth();
  const navigate = useNavigate();
  const pathname = useLocation({ select: (location) => location.pathname });

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/dang-nhap", search: { redirect: pathname }, replace: true });
    }
  }, [loading, user, navigate, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Đang tải tài khoản...
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-24">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
              {user.name.trim().charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.phone ?? user.email}</p>
              <p className="mt-0.5 text-xs font-medium text-primary">{tierLabel(user.membership.tier)}</p>
            </div>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact }}
                activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
                inactiveProps={{ className: "hover:bg-secondary" }}
                className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleLogout}
              className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition hover:bg-destructive/5"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </nav>
        </aside>
        <section className="min-w-0">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
