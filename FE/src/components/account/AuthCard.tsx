import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiErrorMessage } from "@/lib/api-client";
import { useCustomerAuth } from "@/lib/customer-auth";

type Mode = "login" | "register";

export const accountInputClass = (hasError?: boolean) =>
  `w-full rounded-lg border ${hasError ? "border-destructive" : "border-border"} bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:bg-muted disabled:text-muted-foreground`;

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  hasError,
  name,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  name: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${accountInputClass(hasError)} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function AuthCard({ mode, redirect }: { mode: Mode; redirect?: string }) {
  const { user, loading, login, register } = useCustomerAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";
  const destination = redirect && redirect.startsWith("/") ? redirect : "/";

  useEffect(() => {
    if (!loading && user && !submitting) navigate({ to: destination });
  }, [loading, user, submitting, navigate, destination]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (isRegister) {
      if (!name.trim()) next.name = "Vui lòng nhập họ và tên";
      if (!/^0\d{9}$/.test(phone.trim())) next.phone = "Số điện thoại gồm 10 số, bắt đầu bằng 0";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "Email không hợp lệ";
      if (password.length < 8) next.password = "Mật khẩu tối thiểu 8 ký tự";
      if (confirmPassword !== password) next.confirmPassword = "Mật khẩu nhập lại không khớp";
      if (!agreed) next.agreed = "Vui lòng đồng ý với điều khoản sử dụng";
    } else {
      if (!identifier.trim()) next.identifier = "Vui lòng nhập email hoặc số điện thoại";
      if (!password) next.password = "Vui lòng nhập mật khẩu";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setFormError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isRegister) {
        const account = await register({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        });
        toast.success(`Chào mừng ${account.name} đến với Lụa Cosmetics`);
        await navigate({ to: "/" });
      } else {
        await login(identifier.trim(), password);
        toast.success("Đăng nhập thành công");
        await navigate({ to: destination });
      }
    } catch (error) {
      setFormError(
        apiErrorMessage(
          error,
          isRegister ? "Không thể tạo tài khoản. Vui lòng thử lại." : "Đăng nhập thất bại. Vui lòng thử lại.",
        ),
      );
      setSubmitting(false);
    }
  };

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition ${active ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`;

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-14">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold">{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isRegister
            ? "Đăng ký để theo dõi đơn hàng và nhận ưu đãi dành cho khách hàng thân thiết."
            : "Đăng nhập để xem đơn hàng và nhận ưu đãi hạng thành viên."}
        </p>

        <div className="mt-5 flex rounded-full bg-secondary p-1">
          <Link to="/dang-nhap" search={{ redirect }} className={tabClass(!isRegister)}>
            Đăng nhập
          </Link>
          <Link to="/dang-ky" className={tabClass(isRegister)}>
            Đăng ký
          </Link>
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          {isRegister ? (
            <>
              <FormField label="Họ và tên *" error={errors.name}>
                <input
                  name="name"
                  className={accountInputClass(!!errors.name)}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  autoComplete="name"
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Số điện thoại *" error={errors.phone}>
                  <input
                    name="phone"
                    className={accountInputClass(!!errors.phone)}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    inputMode="numeric"
                    autoComplete="tel"
                  />
                </FormField>
                <FormField label="Email *" error={errors.email}>
                  <input
                    name="email"
                    type="email"
                    className={accountInputClass(!!errors.email)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ban@email.com"
                    autoComplete="email"
                  />
                </FormField>
              </div>
              <FormField label="Mật khẩu *" error={errors.password}>
                <PasswordInput
                  name="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Tối thiểu 8 ký tự"
                  hasError={!!errors.password}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Nhập lại mật khẩu *" error={errors.confirmPassword}>
                <PasswordInput
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu"
                  hasError={!!errors.confirmPassword}
                  autoComplete="new-password"
                />
              </FormField>
              <div>
                <label className="flex cursor-pointer items-start gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Lụa Cosmetics.</span>
                </label>
                {errors.agreed && <p className="mt-1 text-xs text-destructive">{errors.agreed}</p>}
              </div>
            </>
          ) : (
            <>
              <FormField label="Email hoặc số điện thoại *" error={errors.identifier}>
                <input
                  name="identifier"
                  className={accountInputClass(!!errors.identifier)}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ban@email.com hoặc 0912345678"
                  autoComplete="username"
                />
              </FormField>
              <FormField label="Mật khẩu *" error={errors.password}>
                <PasswordInput
                  name="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Nhập mật khẩu"
                  hasError={!!errors.password}
                  autoComplete="current-password"
                />
              </FormField>
              <div className="text-right">
                <Link to="/quen-mat-khau" className="text-sm text-primary hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
            </>
          )}

          {formError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            )}
            {isRegister ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isRegister ? (
            <>
              Đã có tài khoản?{" "}
              <Link to="/dang-nhap" className="font-medium text-primary hover:underline">
                Đăng nhập
              </Link>
            </>
          ) : (
            <>
              Chưa có tài khoản?{" "}
              <Link to="/dang-ky" className="font-medium text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
