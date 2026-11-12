import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "@/components/account/AuthCard";

export const Route = createFileRoute("/dang-nhap")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({ meta: [{ title: "Đăng nhập — Lụa Cosmetics" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { redirect } = Route.useSearch();
  return <AuthCard mode="login" redirect={redirect} />;
}
