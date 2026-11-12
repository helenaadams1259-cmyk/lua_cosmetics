import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { FormField, accountInputClass } from "@/components/account/AuthCard";
import { apiErrorMessage } from "@/lib/api-client";
import { requestPasswordReset } from "@/lib/customer-api";

export const Route = createFileRoute("/quen-mat-khau")({
  head: () => ({ meta: [{ title: "Quên mật khẩu — Lụa Cosmetics" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState("");

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Email không hợp lệ");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset(value);
      setSentTo(value);
    } catch (err) {
      setError(apiErrorMessage(err, "Không thể gửi yêu cầu. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-14">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        {sentTo ? (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-green-600">
              <MailCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Kiểm tra hộp thư của bạn</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Nếu <span className="font-medium text-foreground">{sentTo}</span> đã đăng ký tài khoản,
              chúng tôi vừa gửi liên kết đặt lại mật khẩu. Liên kết có hiệu lực trong 15 phút.
            </p>
            <Link
              to="/dang-nhap"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Quên mật khẩu</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu (hiệu lực 15 phút).
            </p>
            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <FormField label="Email *" error={error}>
                <input
                  name="email"
                  type="email"
                  className={accountInputClass(!!error)}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ban@email.com"
                  autoComplete="email"
                />
              </FormField>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
              >
                {submitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                )}
                Gửi liên kết đặt lại
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Nhớ mật khẩu rồi?{" "}
              <Link to="/dang-nhap" className="font-medium text-primary hover:underline">
                Đăng nhập
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
