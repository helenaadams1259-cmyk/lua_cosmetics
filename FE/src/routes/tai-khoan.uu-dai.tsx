import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { tierLabel } from "@/lib/customer-api";
import { useCustomerAuth } from "@/lib/customer-auth";
import { formatVND } from "@/lib/format";

export const Route = createFileRoute("/tai-khoan/uu-dai")({
  head: () => ({ meta: [{ title: "Ưu đãi của tôi — Lụa Cosmetics" }] }),
  component: MembershipPage,
});

function MembershipPage() {
  const { user, refresh } = useCustomerAuth();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!user) return null;
  const { membership } = user;
  const { tier, next_tier: nextTier } = membership;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ưu đãi của tôi</h1>

      <div className="rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary-foreground/80">Hạng hiện tại</p>
            <p data-testid="current-tier" className="mt-1 font-display text-3xl font-bold">
              {tierLabel(tier)}
            </p>
            <p className="mt-1 text-sm text-primary-foreground/90">
              {tier.discount_percent > 0
                ? `Ưu đãi giảm ${tier.discount_percent}% cho mọi đơn hàng`
                : "Chưa có ưu đãi giảm giá, mua thêm để lên hạng"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-primary-foreground/80">Tổng chi tiêu</p>
            <p data-testid="total-spent" className="mt-1 text-2xl font-bold">
              {formatVND(membership.total_spent)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-primary-foreground/25">
            <div
              className="h-full rounded-full bg-primary-foreground transition-all"
              style={{ width: `${Math.min(100, Math.max(0, membership.progress_percent))}%` }}
            />
          </div>
          <p data-testid="next-tier-hint" className="mt-3 text-sm">
            {nextTier ? (
              <>
                Mua thêm <span className="font-semibold">{formatVND(membership.amount_to_next)}</span> để lên hạng{" "}
                <span className="font-semibold">{nextTier.name}</span> — giảm {nextTier.discount_percent}% mọi đơn hàng
              </>
            ) : (
              "Bạn đang ở hạng cao nhất. Cảm ơn bạn đã đồng hành cùng Lụa Cosmetics."
            )}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Các hạng thành viên</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {membership.tiers.map((item) => {
            const isCurrent = item.code === tier.code;
            return (
              <div
                key={item.code}
                className={`relative rounded-2xl border-2 bg-card p-5 text-center ${isCurrent ? "border-primary" : "border-border"}`}
              >
                {isCurrent && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">
                    Hạng của bạn
                  </span>
                )}
                <p className="font-display text-lg font-bold">{item.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">Từ {formatVND(item.min_spent)}</p>
                <p className={`mt-3 text-sm font-semibold ${item.discount_percent > 0 ? "text-primary" : "text-muted-foreground"}`}>
                  {item.discount_percent > 0 ? `Giảm ${item.discount_percent}%` : "Không giảm"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Cách tính hạng:</span> tổng giá trị các đơn hàng đã
          thanh toán hoặc đã hoàn thành của tài khoản. Hạng được cập nhật tự động và áp dụng ngay khi thanh
          toán: nếu đơn đang đặt cộng với lịch sử chi tiêu vượt ngưỡng, mức giảm của hạng mới được trừ luôn
          vào đơn đó. Đơn đã hủy hoặc đã hoàn tiền không được tính.
        </p>
        <Link to="/san-pham" className="mt-3 inline-block font-medium text-primary hover:underline">
          Tiếp tục mua sắm
        </Link>
      </div>
    </div>
  );
}
