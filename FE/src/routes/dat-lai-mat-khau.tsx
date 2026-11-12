import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, TimerOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { FormField, PasswordInput } from "@/components/account/AuthCard";
import { apiErrorMessage } from "@/lib/api-client";
import { resetPassword, validateResetToken } from "@/lib/customer-api";

export const Route = createFileRoute("/dat-lai-mat-khau")({
  validateSearch: (search: Record<string, unknown>): { token?: string } => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  head: () => ({ meta: [{ title: "Đặt lại mật khẩu — Lụa Cosmetics" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validation = useQuery({
    queryKey: ["reset-token", token],
    queryFn: () => validateResetToken(token ?? ""),
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !token) return;
    const next: Record<string, string> = {};
    if (password.length < 8) next.password = "Mật khẩu tối thiểu 8 ký tự";
    if (confirmPassword !== password) next.confirmPassword = "Mật khẩu nhập lại không khớp";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      await resetPassword(token, password);
      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.");
      await navigate({ to: "/dang-nhap", search: { redirect: undefined } });
    } catch (error) {
      setFormError(apiErrorMessage(error, "Không thể đặt lại mật khẩu. Vui lòng thử lại."));
      setSubmitting(false);
    }
  };

  const isInvalid = !token || validation.data === false || validation.isError;

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-14">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        {token && validation.isLoading ? (
          <div className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Đang kiểm tra liên kết...
          </div>
        ) : isInvalid ? (
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-600">
              <TimerOff className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-2xl font-bold">Liên kết đã hết hạn</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Liên kết đặt lại mật khẩu không hợp lệ hoặc đã quá 15 phút. Vui lòng gửi lại yêu cầu mới.
            </p>
            <Link
              to="/quen-mat-khau"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Gửi lại liên kết
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Đặt lại mật khẩu</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tạo mật khẩu mới cho tài khoản của bạn.</p>
            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <FormField label="Mật khẩu mới *" error={errors.password}>
                <PasswordInput
                  name="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Tối thiểu 8 ký tự"
                  hasError={!!errors.password}
                  autoComplete="new-password"
                />
              </FormField>
              <FormField label="Nhập lại mật khẩu mới *" error={errors.confirmPassword}>
                <PasswordInput
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới"
                  hasError={!!errors.confirmPassword}
                  autoComplete="new-password"
                />
              </FormField>
              {formError && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {formError}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
              >
                {submitting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                )}
                Lưu mật khẩu mới
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
