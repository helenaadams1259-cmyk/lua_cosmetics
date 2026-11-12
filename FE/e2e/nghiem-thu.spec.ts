import { expect, test, type Page } from "@playwright/test";
import {
  adminCompleteOrder,
  buildVnpayReturnSearch,
  createResetToken,
  expireResetToken,
  formatVND,
  pickProduct,
  setCart,
  shot,
  type ApiProduct,
} from "./helpers";

test.describe.configure({ mode: "serial" });

const runId = Date.now().toString().slice(-8);
const customer = {
  name: "Nguyễn Văn An",
  email: `delivered+lua${runId}@resend.dev`,
  phone: `09${runId}`,
  password: "matkhau123",
  changedPassword: "matkhaumoi456",
  resetPassword: "matkhaureset789",
};
const SHIPPING_FEE = 30000;

let page: Page;
let product: ApiProduct;
let codOrderId = 0;
let codOrderTotal = 0;
let vnpayOrderTotal = 0;
let vnpayTxnRef = "";
let repayUrl = "";

async function openAccountMenu() {
  await page.getByTestId("account-button").click();
}

async function logoutFromMenu() {
  await openAccountMenu();
  await page.getByRole("menu").getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page.getByTestId("account-button")).toContainText("Tài khoản");
}

async function login(password: string) {
  await page.goto("/dang-nhap");
  await page.locator('input[name="identifier"]').fill(customer.email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
}

async function fillShippingAddress() {
  await page.locator('select[name="province"]').selectOption({ label: "TP. Hồ Chí Minh" });
  await page.locator('select[name="district"]').selectOption({ label: "Quận 1" });
  await page.locator('select[name="ward"]').selectOption({ label: "Phường Bến Nghé" });
  await page.locator('input[name="street"]').fill("123 Nguyễn Huệ");
}

test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "vi-VN" });
  page = await context.newPage();
  product = await pickProduct(100000, 400000);
});

test.afterAll(async () => {
  await page.context().close();
});

test("Trang chủ có mục Tài khoản cạnh Giỏ hàng và khối đăng nhập nhanh", async () => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sản phẩm bán chạy" })).toBeVisible();
  await expect(page.getByTestId("account-button")).toContainText("Tài khoản");
  await openAccountMenu();
  await expect(page.getByText("Chào mừng bạn đến với Lụa")).toBeVisible();
  await expect(page.getByRole("menu").getByRole("link", { name: "Đăng nhập" })).toBeVisible();
  await expect(page.getByRole("menu").getByRole("link", { name: "Đăng ký" })).toBeVisible();
  await shot(page, "01-trang-chu-menu-tai-khoan");
});

test("Kịch bản 1: đăng ký hợp lệ, tự đăng nhập và về trang chủ", async () => {
  await page.getByRole("menu").getByRole("link", { name: "Đăng ký" }).click();
  await expect(page.getByRole("heading", { name: "Tạo tài khoản" })).toBeVisible();

  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();
  await expect(page.getByText("Vui lòng nhập họ và tên")).toBeVisible();
  await expect(page.getByText("Mật khẩu tối thiểu 8 ký tự")).toBeVisible();

  await page.locator('input[name="name"]').fill(customer.name);
  await page.locator('input[name="phone"]').fill(customer.phone);
  await page.locator('input[name="email"]').fill(customer.email);
  await page.locator('input[name="password"]').fill(customer.password);
  await page.locator('input[name="confirmPassword"]').fill(customer.password);
  await shot(page, "02-dang-ky-tai-khoan");
  await page.getByRole("button", { name: "Đăng ký", exact: true }).click();

  await expect(page).toHaveURL("http://localhost:8080/");
  await expect(page.getByTestId("account-button")).toContainText("Văn An");
  await openAccountMenu();
  await expect(page.getByRole("menu")).toContainText(customer.name);
  await expect(page.getByRole("menu")).toContainText("Thành viên");
  await shot(page, "03-sau-dang-ky-ve-trang-chu");
  await page.keyboard.press("Escape");
});

test("Kịch bản 2: đăng nhập sai mật khẩu bị báo lỗi", async () => {
  await logoutFromMenu();
  await login("saimatkhau999");
  await expect(page.getByRole("alert")).toContainText("mật khẩu không đúng");
  await expect(page).toHaveURL(/\/dang-nhap/);
  await expect(page.getByTestId("account-button")).toContainText("Tài khoản");
  await shot(page, "04-dang-nhap-sai-mat-khau");

  await page.locator('input[name="password"]').fill(customer.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByTestId("account-button")).toContainText("Văn An");
});

test("Tài khoản của tôi: xem và sửa họ tên, số điện thoại, địa chỉ giao hàng", async () => {
  await page.goto("/tai-khoan");
  await expect(page.getByRole("heading", { name: "Thông tin tài khoản" })).toBeVisible();
  await expect(page.locator('input[name="name"]')).toHaveValue(customer.name);
  await expect(page.locator('input[name="email"]')).toHaveValue(customer.email);

  await page.locator('input[name="name"]').fill("Nguyễn Văn An Bình");
  await fillShippingAddress();
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("Đã lưu thông tin tài khoản")).toBeVisible();

  await page.reload();
  await expect(page.locator('input[name="name"]')).toHaveValue("Nguyễn Văn An Bình");
  await expect(page.locator('select[name="district"]')).toHaveValue("Quận 1");
  await expect(page.locator('input[name="street"]')).toHaveValue("123 Nguyễn Huệ");
  await shot(page, "05-tai-khoan-cua-toi");
});

test("Kịch bản 3 và 6: mua COD khi đã đăng nhập, vượt ngưỡng hạng được giảm ngay lúc thanh toán", async () => {
  const quantity = Math.floor(600000 / product.price) + 1;
  const subtotal = product.price * quantity;
  const discountAmount = Math.floor((subtotal * 2) / 100);
  codOrderTotal = subtotal + SHIPPING_FEE - discountAmount;

  await setCart(page, product, quantity);
  await page.goto("/thanh-toan");
  await expect(page.getByRole("heading", { name: "Thanh toán", exact: true })).toBeVisible();

  await expect(page.locator('input[name="fullName"]')).toHaveValue("Nguyễn Văn An Bình");
  await expect(page.locator('input[name="phone"]')).toHaveValue(customer.phone);
  await expect(page.locator('select[name="ward"]')).toHaveValue("Phường Bến Nghé");
  await expect(page.locator('input[name="street"]')).toHaveValue("123 Nguyễn Huệ");

  await expect(page.getByTestId("membership-banner")).toContainText("lên hạng");
  await expect(page.getByTestId("membership-banner")).toContainText("Thành viên Bạc");
  await expect(page.getByTestId("membership-discount")).toContainText("Ưu đãi hạng Bạc (-2%)");
  await expect(page.getByTestId("membership-discount")).toContainText(`-${formatVND(discountAmount)}`);
  await expect(page.getByTestId("checkout-total")).toHaveText(formatVND(codOrderTotal));
  await shot(page, "06-thanh-toan-uu-dai-hang-thanh-vien");

  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();
  await expect(page.getByTestId("result-heading")).toHaveText("Đặt hàng thành công!");
  await expect(page.getByTestId("payment-status")).toHaveText("Thanh toán sau khi nhận hàng");
  await expect(page.getByText("Ưu đãi hạng Bạc (-2%)")).toBeVisible();
  await shot(page, "07-dat-hang-cod-thanh-cong");

  codOrderId = await page.evaluate(() => JSON.parse(localStorage.getItem("cosmetic_last_order") ?? "{}").id);
  expect(codOrderId).toBeGreaterThan(0);

  await page.getByRole("link", { name: "Xem đơn hàng của tôi" }).click();
  await expect(page.getByRole("heading", { name: "Đơn hàng của tôi" })).toBeVisible();
  const card = page.getByTestId("order-card").first();
  await expect(card.getByTestId("payment-status")).toHaveText("Thanh toán sau khi nhận hàng");
  await expect(card).toContainText("Ưu đãi hạng Bạc (-2%)");
  await expect(card).toContainText(formatVND(codOrderTotal));
  await expect(card).toContainText(product.name);
  await shot(page, "08-don-hang-cua-toi-cod");
});

test("Kịch bản 5: sự cố giữa chừng khi thanh toán VNPay, đơn giữ Chờ thanh toán và có nút Thanh toán lại", async () => {
  await setCart(page, product, 1);
  await page.goto("/thanh-toan");
  await expect(page.locator('input[name="fullName"]')).toHaveValue("Nguyễn Văn An Bình");
  await page.locator('input[name="payment_method"][value="vnpay"]').check();
  const paymentRequest = page.waitForRequest(/vpcpay\.html/, { timeout: 45_000 });
  await page.getByRole("button", { name: "Thanh toán với VNPay" }).click();
  const firstPaymentUrl = (await paymentRequest).url();
  expect(firstPaymentUrl).toContain("vnp_TxnRef=LC");

  await page.waitForURL(/sandbox\.vnpayment\.vn/, { timeout: 45_000 });
  await expect(page).not.toHaveURL(/Error\.html/);
  await expect(page.getByText("Chọn phương thức thanh toán").first()).toBeVisible();
  await shot(page, "09-chuyen-sang-cong-vnpay");

  await page.goto("/tai-khoan/don-hang");
  await page.getByTestId("order-tab-awaiting_payment").click();
  const card = page.getByTestId("order-card").first();
  await expect(card.getByTestId("payment-status")).toHaveText("Chờ thanh toán");
  await expect(card.getByRole("button", { name: "Thanh toán lại" })).toBeVisible();
  await expect(page.getByTestId("order-card")).toHaveCount(1);
  await shot(page, "10-don-cho-thanh-toan-co-nut-thanh-toan-lai");

  await page.goto(`/dat-hang-thanh-cong${buildVnpayReturnSearch(firstPaymentUrl, "24")}`);
  await expect(page.getByTestId("result-heading")).toHaveText("Thanh toán chưa hoàn tất");
  await expect(page.getByTestId("payment-status")).toHaveText("Chờ thanh toán");
  await expect(page.getByRole("button", { name: "Thanh toán lại" })).toBeVisible();
  await shot(page, "11-thanh-toan-vnpay-chua-hoan-tat");

  const repayRequest = page.waitForRequest(/vpcpay\.html/, { timeout: 45_000 });
  await page.getByRole("button", { name: "Thanh toán lại" }).click();
  repayUrl = (await repayRequest).url();
  await page.waitForURL(/sandbox\.vnpayment\.vn/, { timeout: 45_000 });
  await expect(page).not.toHaveURL(/Error\.html/);
  const firstRef = new URL(firstPaymentUrl).searchParams.get("vnp_TxnRef");
  vnpayTxnRef = new URL(repayUrl).searchParams.get("vnp_TxnRef") ?? "";
  expect(vnpayTxnRef).not.toBe(firstRef);
  vnpayOrderTotal = Number(new URL(repayUrl).searchParams.get("vnp_Amount")) / 100;
});

test("Kịch bản 4: thanh toán VNPay thành công, đơn hiển thị Đã thanh toán", async () => {
  await page.goto(`/dat-hang-thanh-cong${buildVnpayReturnSearch(repayUrl, "00")}`);
  await expect(page.getByTestId("result-heading")).toHaveText("Thanh toán thành công!");
  await expect(page.getByTestId("payment-status")).toHaveText("Đã thanh toán");
  await expect(page.getByText(vnpayTxnRef)).toBeVisible();
  await shot(page, "12-thanh-toan-vnpay-thanh-cong");

  await page.goto("/tai-khoan/don-hang");
  const card = page.getByTestId("order-card").first();
  await expect(card.getByTestId("payment-status")).toHaveText("Đã thanh toán");
  await expect(card.getByRole("button", { name: "Thanh toán lại" })).toHaveCount(0);
  await page.getByTestId("order-tab-awaiting_payment").click();
  await expect(page.getByText("Không có đơn hàng nào ở trạng thái này.")).toBeVisible();
  await page.getByTestId("order-tab-all").click();
  await shot(page, "13-don-hang-cua-toi-da-thanh-toan");

  await page.getByTestId("order-card").first().getByRole("link", { name: "Xem chi tiết" }).click();
  await expect(page.getByRole("heading", { name: /Chi tiết đơn hàng LC/ })).toBeVisible();
  await expect(page.getByTestId("payment-status")).toHaveText("Đã thanh toán");
  await expect(page.getByText("14567890").first()).toBeVisible();
  await expect(page.getByText("NCB")).toBeVisible();
  await expect(page.getByText("Thanh toán VNPay thành công")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lịch sử giao dịch VNPay" })).toBeVisible();
  await expect(page.getByText("Không thành công")).toBeVisible();
  await shot(page, "14-chi-tiet-don-hang-vnpay");
});

test("Ưu đãi của tôi: hạng hiện tại, tổng chi tiêu và số tiền cần mua thêm", async () => {
  await adminCompleteOrder(codOrderId);
  const totalSpent = codOrderTotal + vnpayOrderTotal;

  await page.goto("/tai-khoan/uu-dai");
  await expect(page.getByRole("heading", { name: "Ưu đãi của tôi" })).toBeVisible();
  await expect(page.getByTestId("total-spent")).toHaveText(formatVND(totalSpent));
  await expect(page.getByTestId("current-tier")).toHaveText("Thành viên Bạc");
  await expect(page.getByTestId("next-tier-hint")).toContainText(formatVND(2000000 - totalSpent));
  await expect(page.getByTestId("next-tier-hint")).toContainText("Vàng");
  await expect(page.getByText("Hạng của bạn")).toBeVisible();
  await shot(page, "15-uu-dai-cua-toi");

  await setCart(page, product, 1);
  await page.goto("/thanh-toan");
  await expect(page.getByTestId("membership-banner")).toContainText("Bạn đang là Thành viên Bạc");
  await expect(page.getByTestId("membership-discount")).toContainText("(-2%)");
  await page.evaluate(() => localStorage.removeItem("cosmetic_cart_v2"));
});

test("Kịch bản 7a: đổi mật khẩu, đăng nhập được bằng mật khẩu mới", async () => {
  await page.goto("/tai-khoan/doi-mat-khau");
  await page.locator('input[name="currentPassword"]').fill("saimatkhau999");
  await page.locator('input[name="newPassword"]').fill(customer.changedPassword);
  await page.locator('input[name="confirmPassword"]').fill(customer.changedPassword);
  await page.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
  await expect(page.getByRole("alert")).toContainText("Mật khẩu hiện tại không đúng");

  await page.locator('input[name="currentPassword"]').fill(customer.password);
  await page.locator('input[name="newPassword"]').fill("1234567");
  await page.locator('input[name="confirmPassword"]').fill("1234567");
  await page.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
  await expect(page.getByText("Mật khẩu mới tối thiểu 8 ký tự")).toBeVisible();
  await shot(page, "16-doi-mat-khau");

  await page.locator('input[name="newPassword"]').fill(customer.changedPassword);
  await page.locator('input[name="confirmPassword"]').fill(customer.changedPassword);
  await page.getByRole("button", { name: "Cập nhật mật khẩu" }).click();
  await expect(page.getByText("Đổi mật khẩu thành công")).toBeVisible();

  await logoutFromMenu();
  await login(customer.password);
  await expect(page.getByRole("alert")).toContainText("mật khẩu không đúng");
  await page.locator('input[name="password"]').fill(customer.changedPassword);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByTestId("account-button")).toContainText("An Bình");
});

test("Kịch bản 7b: quên mật khẩu, liên kết đặt lại hết hạn sau 15 phút", async () => {
  await logoutFromMenu();
  await page.goto("/dang-nhap");
  await page.getByRole("link", { name: "Quên mật khẩu?" }).click();
  await expect(page.getByRole("heading", { name: "Quên mật khẩu" })).toBeVisible();
  await page.locator('input[name="email"]').fill(customer.email);
  await shot(page, "17-quen-mat-khau");
  await page.getByRole("button", { name: "Gửi liên kết đặt lại" }).click();
  await expect(page.getByRole("heading", { name: "Kiểm tra hộp thư của bạn" })).toBeVisible();
  await expect(page.getByText("15 phút")).toBeVisible();
  await shot(page, "18-da-gui-lien-ket-dat-lai");

  const expiredToken = createResetToken(customer.email);
  expireResetToken(customer.email);
  await page.goto(`/dat-lai-mat-khau?token=${expiredToken}`);
  await expect(page.getByRole("heading", { name: "Liên kết đã hết hạn" })).toBeVisible();
  await shot(page, "19-lien-ket-dat-lai-het-han");

  const token = createResetToken(customer.email);
  await page.goto(`/dat-lai-mat-khau?token=${token}`);
  await expect(page.getByRole("heading", { name: "Đặt lại mật khẩu" })).toBeVisible();
  await page.locator('input[name="password"]').fill(customer.resetPassword);
  await page.locator('input[name="confirmPassword"]').fill(customer.resetPassword);
  await shot(page, "20-dat-lai-mat-khau");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await expect(page).toHaveURL(/\/dang-nhap/);

  await page.goto(`/dat-lai-mat-khau?token=${token}`);
  await expect(page.getByRole("heading", { name: "Liên kết đã hết hạn" })).toBeVisible();

  await login(customer.changedPassword);
  await expect(page.getByRole("alert")).toContainText("mật khẩu không đúng");
  await page.locator('input[name="password"]').fill(customer.resetPassword);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByTestId("account-button")).toContainText("An Bình");
});

test("Giao diện di động: đơn hàng của tôi không vỡ bố cục", async () => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tai-khoan/don-hang");
  await expect(page.getByTestId("order-card").first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await shot(page, "21-di-dong-don-hang-cua-toi");
  await page.setViewportSize({ width: 1440, height: 900 });
});

test("Kịch bản 8: khách vãng lai đặt hàng không cần đăng nhập", async () => {
  await logoutFromMenu();
  await page.evaluate(() => localStorage.removeItem("cosmetic_cart_v2"));
  await page.goto("/");
  await page.getByRole("button", { name: "Thêm" }).first().click();
  await page.getByRole("banner").getByRole("link", { name: /Giỏ hàng/ }).click();
  await expect(page).toHaveURL(/\/gio-hang/);
  await page.getByRole("link", { name: /Tiến hành thanh toán/ }).click();

  await expect(page.getByRole("heading", { name: "Thanh toán", exact: true })).toBeVisible();
  await expect(page.getByTestId("membership-banner")).toHaveCount(0);
  await expect(page.getByTestId("membership-discount")).toHaveCount(0);
  await expect(page.getByText("Bạn vẫn có thể đặt hàng mà không cần tài khoản")).toBeVisible();

  await page.locator('input[name="fullName"]').fill("Khách Vãng Lai");
  await page.locator('input[name="phone"]').fill("0933333333");
  await fillShippingAddress();
  await shot(page, "22-khach-vang-lai-thanh-toan");
  await page.getByRole("button", { name: "Đặt hàng", exact: true }).click();

  await expect(page.getByTestId("result-heading")).toHaveText("Đặt hàng thành công!");
  await expect(page.getByTestId("payment-status")).toHaveText("Thanh toán sau khi nhận hàng");
  await expect(page.getByRole("link", { name: "Xem đơn hàng của tôi" })).toHaveCount(0);
  await expect(page.getByText(/Ưu đãi hạng/)).toHaveCount(0);
  await shot(page, "23-khach-vang-lai-dat-hang-thanh-cong");

  await page.goto("/tai-khoan/don-hang");
  await expect(page).toHaveURL(/\/dang-nhap/);
});

test("Chức năng hiện có: danh sách và chi tiết sản phẩm vẫn hoạt động", async () => {
  await page.goto("/san-pham");
  await expect(page.getByRole("button", { name: "Thêm" }).first()).toBeVisible();
  await shot(page, "24-danh-sach-san-pham");
  await page.goto(`/san-pham/${product.slug}-${product.id}.html`);
  await expect(page.getByRole("heading", { name: product.name }).first()).toBeVisible();
  await shot(page, "25-chi-tiet-san-pham");
});

test("Quản trị đối soát đơn theo mã giao dịch VNPay", async () => {
  await page.goto("/admin/login");
  await page.locator('input[type="text"]').fill("admin");
  await page.locator('input[type="password"]').fill("admin123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/admin\/dashboard/);
  await page.goto("/admin/orders");
  await expect(page.getByRole("columnheader", { name: "Thanh toán" })).toBeVisible();

  await page.getByPlaceholder(/mã giao dịch VNPay/).fill(vnpayTxnRef);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  const row = page.locator("tbody tr").first();
  await expect(row).toContainText(vnpayTxnRef);
  await expect(row).toContainText("Đã thanh toán");
  await shot(page, "26-quan-tri-tim-theo-ma-giao-dich");

  await row.getByTitle("Xem chi tiết").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Đối soát thanh toán");
  await expect(dialog).toContainText("14567890");
  await expect(dialog.getByRole("button", { name: "Ghi nhận hoàn tiền" })).toBeVisible();
  await shot(page, "27-quan-tri-doi-soat-thanh-toan");
});
