import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FormField, PasswordInput } from "@/components/account/AuthCard";
import { apiErrorMessage } from "@/lib/api-client";
import { changePassword } from "@/lib/customer-api";

export const Route = createFileRoute("/tai-khoan/doi-mat-khau")({
  head: () => ({ meta: [{ title: "Đổi mật khẩu — Lụa Cosmetics" }] }),
  component: ChangePasswordPage,
});

function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const next: Record<string, string> = {};
    if (!currentPassword) next.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    if (newPassword.length < 8) next.newPassword = "Mật khẩu mới tối thiểu 8 ký tự";
    if (confirmPassword !== newPassword) next.confirmPassword = "Mật khẩu nhập lại không khớp";
    setErrors(next);
    setFormError("");
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setFormError(apiErrorMessage(error, "Không thể đổi mật khẩu. Vui lòng thử lại."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Đổi mật khẩu</h1>
      <form onSubmit={onSubmit} noValidate className="max-w-xl rounded-2xl border border-border bg-card p-6">
        <div className="space-y-4">
          <FormField label="Mật khẩu hiện tại *" error={errors.currentPassword}>
            <PasswordInput
              name="currentPassword"
              value={currentPassword}
              onChange={setCurrentPassword}
              hasError={!!errors.currentPassword}
              autoComplete="current-password"
            />
          </FormField>
          <FormField label="Mật khẩu mới *" error={errors.newPassword}>
            <PasswordInput
              name="newPassword"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Tối thiểu 8 ký tự"
              hasError={!!errors.newPassword}
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Nhập lại mật khẩu mới *" error={errors.confirmPassword}>
            <PasswordInput
              name="confirmPassword"
              value={confirmPassword}
              onChange={setConfirmPassword}
              hasError={!!errors.confirmPassword}
              autoComplete="new-password"
            />
          </FormField>
        </div>
        {formError && (
          <p role="alert" className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
            {formError}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link to="/quen-mat-khau" className="text-sm text-primary hover:underline">
            Quên mật khẩu hiện tại?
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
            )}
            Cập nhật mật khẩu
          </button>
        </div>
      </form>
    </div>
  );
}
