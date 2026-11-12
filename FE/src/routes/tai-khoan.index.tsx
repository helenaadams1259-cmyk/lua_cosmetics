import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FormField, accountInputClass } from "@/components/account/AuthCard";
import { apiErrorMessage } from "@/lib/api-client";
import { updateAccount, type Account } from "@/lib/customer-api";
import { useCustomerAuth } from "@/lib/customer-auth";
import { PROVINCES } from "@/lib/vn-address";

export const Route = createFileRoute("/tai-khoan/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useCustomerAuth();
  if (!user) return null;
  return <ProfileForm key={user.id} user={user} />;
}

function ProfileForm({ user }: { user: Account }) {
  const { setUser } = useCustomerAuth();
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [provinceName, setProvinceName] = useState(user.province ?? "");
  const [districtName, setDistrictName] = useState(user.district ?? "");
  const [ward, setWard] = useState(user.ward ?? "");
  const [street, setStreet] = useState(user.street_address ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const province = PROVINCES.find((p) => p.name === provinceName) ?? null;
  const districts = province?.districts ?? [];
  const district = districts.find((d) => d.name === districtName) ?? null;
  const wards = district?.wards ?? [];

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Vui lòng nhập họ và tên";
    if (!/^0\d{9}$/.test(phone.trim())) next.phone = "Số điện thoại gồm 10 số, bắt đầu bằng 0";
    if (provinceName && !districtName) next.district = "Vui lòng chọn quận/huyện";
    if (districtName && !ward) next.ward = "Vui lòng chọn phường/xã";
    if (provinceName && !street.trim()) next.street = "Vui lòng nhập số nhà, tên đường";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateAccount({
        name: name.trim(),
        phone: phone.trim(),
        province: provinceName,
        district: districtName,
        ward,
        street_address: street.trim(),
      });
      setUser(updated);
      toast.success("Đã lưu thông tin tài khoản");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Không thể lưu thông tin. Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <h1 className="text-2xl font-bold">Thông tin tài khoản</h1>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Thông tin cá nhân</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Họ và tên *" error={errors.name}>
            <input
              name="name"
              className={accountInputClass(!!errors.name)}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Số điện thoại *" error={errors.phone}>
            <input
              name="phone"
              className={accountInputClass(!!errors.phone)}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="numeric"
            />
          </FormField>
          <FormField label="Email">
            <input name="email" className={accountInputClass()} value={user.email ?? ""} disabled />
            <p className="mt-1 text-xs text-muted-foreground">Email dùng để đăng nhập và nhận liên kết đặt lại mật khẩu.</p>
          </FormField>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Địa chỉ giao hàng</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">
          Địa chỉ này được điền sẵn ở bước thanh toán.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Tỉnh / Thành phố">
            <select
              name="province"
              className={accountInputClass()}
              value={provinceName}
              onChange={(e) => {
                setProvinceName(e.target.value);
                setDistrictName("");
                setWard("");
              }}
            >
              <option value="">-- Chọn --</option>
              {PROVINCES.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Quận / Huyện" error={errors.district}>
            <select
              name="district"
              className={accountInputClass(!!errors.district)}
              value={districtName}
              disabled={!province}
              onChange={(e) => {
                setDistrictName(e.target.value);
                setWard("");
              }}
            >
              <option value="">-- Chọn --</option>
              {districts.map((d) => (
                <option key={d.name} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Phường / Xã" error={errors.ward}>
            <select
              name="ward"
              className={accountInputClass(!!errors.ward)}
              value={ward}
              disabled={!district}
              onChange={(e) => setWard(e.target.value)}
            >
              <option value="">-- Chọn --</option>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="mt-4">
          <FormField label="Số nhà, tên đường" error={errors.street}>
            <input
              name="street"
              className={accountInputClass(!!errors.street)}
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="123 Nguyễn Huệ"
            />
          </FormField>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
          )}
          Lưu thay đổi
        </button>
      </div>
    </form>
  );
}
