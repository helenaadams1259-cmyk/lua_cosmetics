import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  Tags,
  Award,
  ShoppingCart,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";
import { useAdmin } from "@/lib/admin-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Quản lý người dùng", icon: Users },
  { to: "/admin/products", label: "Quản lý sản phẩm", icon: Package },
  { to: "/admin/orders", label: "Quản lý đơn hàng", icon: ShoppingCart },
  { to: "/admin/categories", label: "Quản lý danh mục", icon: Tags },
  { to: "/admin/brands", label: "Quản lý thương hiệu", icon: Award },
] as const;

export function AdminShell({ children, title }: { children: ReactNode; title: string }) {
  const { authed, logout, user } = useAdmin();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!initialized && typeof window !== "undefined") {
      setCollapsed(window.innerWidth < 768);
      setInitialized(true);
    }
  }, [initialized]);

  useEffect(() => {
    if (mounted && !authed) {
      navigate({ to: "/admin/login" });
    }
  }, [mounted, authed, navigate]);

  if (!mounted || !authed) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  const handleLogout = () => {
    logout();
    toast.success("Đã đăng xuất");
    navigate({ to: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside
        className={cn(
          "flex flex-col border-r border-slate-200 bg-white transition-all duration-200",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-md bg-pink-600 text-sm font-bold text-white">
                L
              </div>
              <span className="font-semibold">Lụa Admin</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Thu gọn"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {NAV.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-pink-50 text-pink-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  collapsed && "justify-center",
                )}
                title={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 p-2">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{user?.name || "Admin"}</div>
              <div className="text-xs text-slate-500">
                {user?.is_admin ? "Quản trị viên" : user?.username || "Quản trị viên"}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Đăng xuất
            </button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
