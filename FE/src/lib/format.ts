export const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(n) + "₫";

export const discountPercent = (price: number, oldPrice?: number) =>
  oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

export const formatDateVN = (d: Date) =>
  d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export const genOrderNumber = () =>
  "DH" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
