import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatVND } from "@/lib/format";
import { PROVINCES } from "@/lib/vn-address";
import { createOrder, vnpayCallbackUrl, type CreateOrderPayload } from "@/lib/orders-api";
import { isValidUrl } from "@/lib/vnpay-api";
import { apiErrorMessage } from "@/lib/api-client";
import { fetchMembershipPreview, tierLabel } from "@/lib/customer-api";
import { useCustomerAuth } from "@/lib/customer-auth";

const SHIPPING_FEE = 30000;
const ORDER_KEY = "cosmetic_last_order";

export const Route = createFileRoute("/thanh-toan")({
  head: () => ({ meta: [{ title: "Thanh toán — Lụa Cosmetics" }] }),
  component: Checkout,
});

function Checkout() {
  const { detailed, subtotal, clear, hasStockIssue } = useCart();
  const navigate = useNavigate();
  const { user, refresh } = useCustomerAuth();
  const prefilledUserId = useRef<number | null>(null);


  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [provinceIdx, setProvinceIdx] = useState<number | "">("");
  const [districtIdx, setDistrictIdx] = useState<number | "">("");
  const [ward, setWard] = useState("");
  const [street, setStreet] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "vnpay">("cod");

  const preview = useQuery({
    queryKey: ["membership-preview", user?.id, subtotal],
    queryFn: () => fetchMembershipPreview(subtotal, SHIPPING_FEE),
    enabled: Boolean(user) && subtotal > 0,
    staleTime: 0,
  });
  const discount = user ? preview.data : undefined;
  const discountAmount = discount?.discount_amount ?? 0;
  const total = subtotal + SHIPPING_FEE - discountAmount;
  const province = provinceIdx === "" ? null : PROVINCES[provinceIdx];
  const districts = province?.districts ?? [];
  const district = districtIdx === "" ? null : districts[districtIdx];
  const wards = district?.wards ?? [];

  useEffect(() => {
    if (detailed.length === 0 && !submitting) navigate({ to: "/gio-hang" });
  }, [detailed.length, navigate, submitting]);

  useEffect(() => {
    if (!user || prefilledUserId.current === user.id) return;
    prefilledUserId.current = user.id;
    setFullName((value) => value || user.name);
    setPhone((value) => value || (user.phone ?? ""));
    setEmail((value) => value || (user.email ?? ""));
    setStreet((value) => value || (user.street_address ?? ""));
    const savedProvinceIdx = PROVINCES.findIndex((p) => p.name === user.province);
    if (savedProvinceIdx < 0) return;
    setProvinceIdx(savedProvinceIdx);
    const savedDistricts = PROVINCES[savedProvinceIdx].districts;
    const savedDistrictIdx = savedDistricts.findIndex((d) => d.name === user.district);
    if (savedDistrictIdx < 0) return;
    setDistrictIdx(savedDistrictIdx);
    if (user.ward && savedDistricts[savedDistrictIdx].wards.includes(user.ward)) setWard(user.ward);
  }, [user]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = "Vui lòng nhập họ và tên";
    if (!/^0\d{9}$/.test(phone.trim())) e.phone = "Số điện thoại không hợp lệ (10 số, bắt đầu bằng 0)";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email không hợp lệ";
    if (provinceIdx === "") e.province = "Vui lòng chọn tỉnh/thành";
    if (districtIdx === "") e.district = "Vui lòng chọn quận/huyện";
    if (!ward) e.ward = "Vui lòng chọn phường/xã";
    if (!street.trim()) e.street = "Vui lòng nhập địa chỉ chi tiết";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (submitting) return;
    if (hasStockIssue) {
      toast.error("Một số sản phẩm vượt quá tồn kho. Vui lòng cập nhật giỏ hàng.");
      navigate({ to: "/gio-hang" });
      return;
    }
    if (!validate()) return;
    setSubmitting(true);

    const payload: CreateOrderPayload = {
      customer_name: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      province: province!.name,
      district: district!.name,
      ward,
      street_address: street.trim(),
      payment_method: paymentMethod,
      subtotal,
      shipping_fee: SHIPPING_FEE,
      total_amount: total,
      callback_url: vnpayCallbackUrl(),
      items: detailed.map((d) => ({
        product_id: Number(d.product.id),
        product_name: d.product.name,
        product_image: d.product.image,
        product_price: d.product.price,
        quantity: d.quantity,
        subtotal: d.subtotal,
      })),
    };
    let order;
    try {
      order = await createOrder(payload);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Đặt hàng thất bại."));
      setSubmitting(false);
      return;
    }

    localStorage.setItem(ORDER_KEY, JSON.stringify(order));

    if (paymentMethod === "vnpay") {
      clear();
      if (!isValidUrl(order.payment_url)) {
        toast.error("Đơn hàng đã được lưu nhưng chưa tạo được liên kết VNPay.");
        await navigate({ to: user ? "/tai-khoan/don-hang" : "/dat-hang-thanh-cong" });
        return;
      }
      window.location.href = order.payment_url as string;
      return;
    }

    clear();
    if (user) refresh();
    await navigate({ to: "/dat-hang-thanh-cong" });
  };

  const inputCls = (err?: string) =>
    `w-full rounded-lg border ${err ? "border-destructive" : "border-border"} bg-background px-3 py-2.5 text-sm outline-none focus:border-primary`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <h1 className="mb-6 text-3xl font-bold">Thanh toán</h1>
      {user && discount && (
        <div data-testid="membership-banner" className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {discount.upgraded ? (
            <>
              Đơn hàng này giúp bạn lên hạng <span className="font-semibold">{tierLabel(discount.applied_tier)}</span> —
              mức giảm {discount.discount_percent}% được áp dụng ngay cho đơn này.
            </>
          ) : discount.discount_percent > 0 ? (
            <>
              Bạn đang là <span className="font-semibold">{tierLabel(discount.applied_tier)}</span> — đơn hàng này
              được giảm {discount.discount_percent}%.
            </>
          ) : (
            <>
              Bạn đang là <span className="font-semibold">{tierLabel(discount.applied_tier)}</span>. Tích lũy từ
              500.000₫ để lên hạng Bạc và được giảm 2% mọi đơn hàng.
            </>
          )}
        </div>
      )}
      {!user && (
        <div className="mb-6 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
          <Link to="/dang-nhap" search={{ redirect: "/thanh-toan" }} className="font-semibold text-primary hover:underline">
            Đăng nhập
          </Link>{" "}
          để tự điền thông tin giao hàng, lưu lịch sử đơn và nhận ưu đãi hạng thành viên. Bạn vẫn có thể đặt
          hàng mà không cần tài khoản.
        </div>
      )}
      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <fieldset disabled={submitting} className="contents">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Thông tin khách hàng</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Họ và tên *" error={errors.fullName}>
                <input name="fullName" className={inputCls(errors.fullName)} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nguyễn Văn A" />
              </Field>
              <Field label="Số điện thoại *" error={errors.phone}>
                <input name="phone" className={inputCls(errors.phone)} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912345678" />
              </Field>
              <Field label="Email (không bắt buộc)" error={errors.email}>
                <input name="email" className={inputCls(errors.email)} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@email.com" />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Địa chỉ giao hàng</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Tỉnh / Thành phố *" error={errors.province}>
                <select
                  name="province"
                  className={inputCls(errors.province)}
                  value={provinceIdx}
                  onChange={(e) => { setProvinceIdx(e.target.value === "" ? "" : Number(e.target.value)); setDistrictIdx(""); setWard(""); }}
                >
                  <option value="">-- Chọn --</option>
                  {PROVINCES.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Quận / Huyện *" error={errors.district}>
                <select
                  name="district"
                  className={inputCls(errors.district)}
                  value={districtIdx}
                  onChange={(e) => { setDistrictIdx(e.target.value === "" ? "" : Number(e.target.value)); setWard(""); }}
                  disabled={provinceIdx === ""}
                >
                  <option value="">-- Chọn --</option>
                  {districts.map((d, i) => <option key={d.name} value={i}>{d.name}</option>)}
                </select>
              </Field>
              <Field label="Phường / Xã *" error={errors.ward}>
                <select name="ward" className={inputCls(errors.ward)} value={ward} onChange={(e) => setWard(e.target.value)} disabled={districtIdx === ""}>
                  <option value="">-- Chọn --</option>
                  {wards.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Số nhà, tên đường *" error={errors.street}>
                <input name="street" className={inputCls(errors.street)} value={street} onChange={(e) => setStreet(e.target.value)} placeholder="123 Nguyễn Huệ" />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Phương thức thanh toán</h2>
            <div className="space-y-3">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="h-4 w-4 accent-primary"
                />
                <div>
                  <p className="text-sm font-semibold">Thanh toán khi nhận hàng (COD)</p>
                  <p className="text-xs text-muted-foreground">Thanh toán bằng tiền mặt khi nhận hàng.</p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${paymentMethod === "vnpay" ? "border-primary bg-primary/5" : "border-border"}`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="vnpay"
                  checked={paymentMethod === "vnpay"}
                  onChange={() => setPaymentMethod("vnpay")}
                  className="h-4 w-4 accent-primary"
                />
                <div>
                  <p className="text-sm font-semibold">VNPay - Thanh toán online</p>
                  <p className="text-xs text-muted-foreground">
                    Thanh toán online thông qua cổng VNPay (chuyển khoản, thẻ ATM, thẻ tín dụng, ví điện tử...)
                  </p>
                </div>
              </label>
            </div>
          </section>

        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Đơn hàng ({detailed.length})</h2>
          <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {detailed.map((d) => (
              <div key={d.product.id} className="flex gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  <img src={d.product.image} alt="" className="h-full w-full object-cover" />
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{d.quantity}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs">{d.product.name}</p>
                  <p className="mt-1 text-xs font-semibold text-primary">{formatVND(d.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Tạm tính</span><span>{formatVND(subtotal)}</span></div>
            {discount && discountAmount > 0 && (
              <div data-testid="membership-discount" className="flex justify-between text-green-700">
                <span>Ưu đãi hạng {discount.applied_tier.name} (-{discount.discount_percent}%)</span>
                <span className="font-medium">-{formatVND(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-muted-foreground">Phí vận chuyển</span><span>{formatVND(SHIPPING_FEE)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-base">
              <span className="font-semibold">Tổng cộng</span>
              <span data-testid="checkout-total" className="font-bold text-primary">{formatVND(total)}</span>
            </div>
          </div>
          {hasStockIssue && (
            <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              Một số sản phẩm vượt quá tồn kho hiện có. Vui lòng quay lại giỏ hàng để cập nhật.
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || hasStockIssue}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Đang xử lý...
              </>
            ) : paymentMethod === "vnpay" ? (
              "Thanh toán với VNPay"
            ) : (
              "Đặt hàng"
            )}

          </button>

        </aside>
        </fieldset>
      </form>
      {submitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in">
          <div className="mx-4 flex flex-col items-center gap-4 rounded-2xl bg-card px-8 py-8 text-center shadow-2xl">
            <span className="h-12 w-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
            <div>
              <p className="text-base font-semibold text-foreground">Đang xử lý đơn hàng...</p>
              <p className="mt-1 text-sm text-muted-foreground">Vui lòng chờ trong giây lát.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
