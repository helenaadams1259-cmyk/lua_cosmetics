import { useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-client";
import { repayOrder } from "@/lib/customer-api";
import { vnpayCallbackUrl, type Order } from "@/lib/orders-api";
import { isValidUrl } from "@/lib/vnpay-api";

export function RepayButton({ order, className }: { order: Order; className?: string }) {
  const [loading, setLoading] = useState(false);

  const handleRepay = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const updated = await repayOrder(order.id, vnpayCallbackUrl());
      if (!isValidUrl(updated.payment_url)) {
        toast.error("Không thể tạo liên kết thanh toán VNPay. Vui lòng thử lại.");
        setLoading(false);
        return;
      }
      window.location.href = updated.payment_url as string;
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không thể thanh toán lại. Vui lòng thử lại."));
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleRepay}
      disabled={loading}
      data-testid={`repay-${order.id}`}
      className={
        className ??
        "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
      }
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
      )}
      Thanh toán lại
    </button>
  );
}
