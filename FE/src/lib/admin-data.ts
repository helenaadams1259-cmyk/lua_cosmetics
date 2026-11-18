import { PRODUCTS, CATEGORIES, type Product } from "./products";

export type AdminUser = {
  id: string;
  avatar: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  status: "active" | "disabled";
  createdAt: string; // ISO date
};

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
};

export type AdminBrand = {
  id: string;
  name: string;
  logo: string;
  country: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const USER_NAMES = [
  "Nguyễn Thu Hà", "Trần Minh Anh", "Lê Hoàng Yến", "Phạm Ngọc Linh", "Đỗ Thùy Trang",
  "Vũ Bảo Ngọc", "Bùi Phương Mai", "Hoàng Diệu Linh", "Đinh Thảo Vy", "Ngô Kim Chi",
  "Lý Quỳnh Anh", "Dương Hải Yến", "Tô Mỹ Duyên", "Cao Thanh Thảo", "Phan Khánh Ly",
  "Hồ Bích Ngọc", "Trịnh Hà My", "Đặng Ngọc Ánh", "Mai Thu Hương", "Chu Lan Anh",
];

const DOMAINS = ["gmail.com", "yahoo.com", "outlook.com"];

export const MOCK_USERS: AdminUser[] = USER_NAMES.map((name, i) => {
  const slug = slugify(name).replace(/-/g, "");
  return {
    id: `US${String(i + 1).padStart(3, "0")}`,
    avatar: `https://i.pravatar.cc/100?img=${(i % 60) + 1}`,
    fullName: name,
    username: slug.slice(0, 12) + (i + 1),
    email: `${slug}${i + 1}@${DOMAINS[i % DOMAINS.length]}`,
    phone: `09${String(10000000 + i * 137913).slice(0, 8)}`,
    status: i % 7 === 0 ? "disabled" : "active",
    createdAt: new Date(2025, (i * 3) % 12, ((i * 5) % 27) + 1).toISOString(),
  };
});

export const MOCK_CATEGORIES: AdminCategory[] = CATEGORIES.map((name, i) => ({
  id: `CT${String(i + 1).padStart(3, "0")}`,
  name,
  slug: slugify(name),
}));

const BRAND_INFO: { name: string; country: string }[] = [
  { name: "Simple", country: "Anh Quốc" },
  { name: "Bioderma", country: "Pháp" },
  { name: "La Roche-Posay", country: "Pháp" },
  { name: "Anessa", country: "Nhật Bản" },
  { name: "CeraVe", country: "Mỹ" },
  { name: "COSRX", country: "Hàn Quốc" },
  { name: "Skin1004", country: "Hàn Quốc" },
  { name: "Hada Labo", country: "Nhật Bản" },
  { name: "Senka", country: "Nhật Bản" },
  { name: "Innisfree", country: "Hàn Quốc" },
  { name: "Klairs", country: "Hàn Quốc" },
  { name: "The Ordinary", country: "Canada" },
  { name: "Neutrogena", country: "Mỹ" },
  { name: "Laneige", country: "Hàn Quốc" },
  { name: "3CE", country: "Hàn Quốc" },
  { name: "MAC", country: "Mỹ" },
  { name: "Merzy", country: "Hàn Quốc" },
  { name: "Missha", country: "Hàn Quốc" },
  { name: "Maybelline", country: "Mỹ" },
  { name: "Garnier", country: "Pháp" },
  { name: "L'Oreal", country: "Pháp" },
  { name: "Some By Mi", country: "Hàn Quốc" },
  { name: "Mamonde", country: "Hàn Quốc" },
  { name: "Mediheal", country: "Hàn Quốc" },
  { name: "Paula's Choice", country: "Mỹ" },
  { name: "Cetaphil", country: "Pháp" },
  { name: "Sunplay", country: "Nhật Bản" },
  { name: "Dior", country: "Pháp" },
];

export const MOCK_BRANDS: AdminBrand[] = BRAND_INFO.map((b, i) => ({
  id: `BR${String(i + 1).padStart(3, "0")}`,
  name: b.name,
  country: b.country,
  logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=fce7f3&color=be185d&bold=true&size=128`,
}));

export type AdminProduct = Product & {
  featured?: boolean;
  status?: "active" | "hidden";
};

export const MOCK_PRODUCTS: AdminProduct[] = PRODUCTS.map((p) => ({
  ...p,
  featured: p.bestSeller || p.flashSale,
  status: "active" as const,
}));
