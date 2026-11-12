import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
export const BACKEND_DIR = path.resolve(currentDir, "../../LuaCosmeticsBackend-main");
export const SCREENSHOT_DIR = path.resolve(currentDir, "../screenshots");
export const API_URL = "http://localhost:8000";

export type ApiProduct = {
  id: number;
  slug: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
};

function readBackendEnv(name: string): string {
  const content = readFileSync(path.join(BACKEND_DIR, ".env"), "utf-8");
  const line = content.split(/\r?\n/).find((entry) => entry.startsWith(`${name}=`));
  if (!line) throw new Error(`Thiếu ${name} trong .env của backend`);
  return line.slice(name.length + 1).trim();
}

function pythonQuotePlus(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%20/g, "+");
}

export function buildVnpayReturnSearch(paymentUrl: string, responseCode: string): string {
  const source = new URL(paymentUrl).searchParams;
  const params: Record<string, string> = {
    vnp_Amount: source.get("vnp_Amount") ?? "",
    vnp_BankCode: "NCB",
    vnp_OrderInfo: source.get("vnp_OrderInfo") ?? "",
    vnp_PayDate: "20261111103000",
    vnp_ResponseCode: responseCode,
    vnp_TmnCode: source.get("vnp_TmnCode") ?? "",
    vnp_TransactionNo: "14567890",
    vnp_TransactionStatus: responseCode,
    vnp_TxnRef: source.get("vnp_TxnRef") ?? "",
  };
  const query = Object.keys(params)
    .sort()
    .map((key) => `${pythonQuotePlus(key)}=${pythonQuotePlus(params[key])}`)
    .join("&");
  const secureHash = createHmac("sha512", readBackendEnv("VNPAY_HASH_SECRET"))
    .update(query, "utf-8")
    .digest("hex")
    .toUpperCase();
  return `?${query}&vnp_SecureHash=${secureHash}`;
}

export function runBackendPython(code: string): string {
  return execFileSync("py", ["-c", code], { cwd: BACKEND_DIR, encoding: "utf-8" }).trim();
}

export function createResetToken(email: string): string {
  return runBackendPython(
    [
      "from app.services.account_service import AccountService",
      "from app.repositories.user_repository import UserRepository",
      `user = UserRepository().get_by_email(${JSON.stringify(email)})`,
      "print(AccountService().create_reset_token(user.id))",
    ].join("\n"),
  );
}

export function expireResetToken(email: string): void {
  runBackendPython(
    [
      "from app.db import get_connection",
      "cursor = get_connection().cursor()",
      `cursor.execute("UPDATE users SET password_reset_expires_at = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE email = %s", (${JSON.stringify(email)},))`,
    ].join("\n"),
  );
}

export async function adminToken(): Promise<string> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function adminCompleteOrder(orderId: number): Promise<void> {
  const token = await adminToken();
  const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: "completed" }),
  });
  if (!response.ok) throw new Error(`Không cập nhật được đơn ${orderId}`);
}

export async function pickProduct(minPrice: number, maxPrice: number): Promise<ApiProduct> {
  const response = await fetch(`${API_URL}/products/product-filter?page=1&page_size=80`);
  const data = (await response.json()) as { data: ApiProduct[] };
  const product = data.data.find(
    (item) => item.stock >= 20 && item.price >= minPrice && item.price <= maxPrice && item.images?.length > 0,
  );
  if (!product) throw new Error("Không tìm thấy sản phẩm phù hợp để kiểm thử");
  return product;
}

export async function setCart(page: Page, product: ApiProduct, quantity: number): Promise<void> {
  await page.evaluate(
    ({ item, qty }) => {
      localStorage.setItem(
        "cosmetic_cart_v2",
        JSON.stringify([
          {
            product: {
              id: String(item.id),
              slug: item.slug,
              name: item.name,
              price: item.price,
              image: item.images[0],
              stock: item.stock,
            },
            quantity: qty,
          },
        ]),
      );
    },
    { item: product, qty: quantity },
  );
}

export async function shot(page: Page, name: string): Promise<void> {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

export function formatVND(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)}₫`;
}
