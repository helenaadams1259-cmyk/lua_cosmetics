import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { fetchAdminStats, type AdminStats } from "@/lib/admin-stats-api";
import { Users, ShoppingCart, Tags, Award, Loader2, AlertCircle, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
});

const STAT_CARDS: {
  key: keyof AdminStats;
  label: string;
  icon: typeof Users;
  color: string;
}[] = [
  { key: "users", label: "Tổng người dùng", icon: Users, color: "bg-blue-500" },
  { key: "orders", label: "Tổng đơn hàng", icon: ShoppingCart, color: "bg-pink-500" },
  { key: "categories", label: "Tổng danh mục", icon: Tags, color: "bg-amber-500" },
  { key: "brands", label: "Tổng thương hiệu", icon: Award, color: "bg-emerald-500" },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err) {
      const status = err instanceof Error && err.message.includes("401") ? 401 : 0;
      if (status === 401) {
        navigate({ to: "/admin/login" });
        return;
      }
      setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell title="Dashboard">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          const value = stats?.[s.key] ?? 0;
          return (
            <div
              key={s.key}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">{s.label}</div>
                  <div className="mt-1 text-2xl font-bold text-slate-900">
                    {loading ? "-" : value.toLocaleString("vi-VN")}
                  </div>
                </div>
                <div
                  className={`grid h-11 w-11 place-items-center rounded-lg ${s.color} text-white`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loading && (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tải dữ liệu thống kê...
        </div>
      )}

      {!loading && error && (
        <div className="mt-8 rounded-xl border border-red-100 bg-red-50 p-5 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={load}
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm hover:bg-red-100"
              >
                <RotateCcw className="h-4 w-4" />
                Thử lại
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
