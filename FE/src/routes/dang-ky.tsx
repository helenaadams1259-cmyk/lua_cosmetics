import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/account/AuthCard";

export const Route = createFileRoute("/dang-ky")({
  head: () => ({ meta: [{ title: "Tạo tài khoản — Lụa Cosmetics" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  return <AuthCard mode="register" />;
}
