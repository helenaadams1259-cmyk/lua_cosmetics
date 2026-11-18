import { apiRequest, normalizePaginated, type PaginatedResponse } from "./api-client";
import { getAuthToken } from "./auth-api";

const BASE_URL = "http://localhost:8000";

export type BulkCsvRowError = { row_number: number; message: string };
export type BulkCsvResult = {
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  errors: BulkCsvRowError[];
  products: unknown[];
};

/**
 * Downloads the sample products CSV template.
 * Public endpoint — no auth header attached, no interceptors.
 */
export async function downloadProductsCsvTemplate(): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/products/bulk-csv/template`, {
    method: "GET",
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const t = await res.text();
      if (t) msg = t;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

  // Preserve filename from Content-Disposition when present.
  let filename = "products_template.csv";
  const cd = res.headers.get("Content-Disposition") || res.headers.get("content-disposition");
  if (cd) {
    const utf8 = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(cd);
    const plain = /filename="?([^"; ]+)"?/i.exec(cd);
    const raw = utf8?.[1] || plain?.[1];
    if (raw) {
      try {
        filename = decodeURIComponent(raw.trim().replace(/^"|"$/g, ""));
      } catch {
        filename = raw.trim().replace(/^"|"$/g, "");
      }
    }
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function bulkUploadProductsCsv(file: File): Promise<BulkCsvResult> {
  // Re-wrap into a fresh File to guarantee the browser serializes real file
  // bytes (with filename + content-type) into the multipart body, rather than
  // an opaque Blob reference. This matches `curl -F "file=@products.csv"`.
  const filename = file.name || "products.csv";
  const csvFile =
    file instanceof File
      ? new File([file], filename, { type: file.type || "text/csv" })
      : new File([file as Blob], filename, { type: "text/csv" });

  const fd = new FormData();
  fd.append("file", csvFile, filename);

  const token = getAuthToken();
  // IMPORTANT: do NOT set Content-Type manually — the browser must generate
  // the multipart/form-data boundary itself.
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  return await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/admin/products/bulk-csv`);
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.onload = () => {
      const status = xhr.status;
      const text = xhr.responseText || "";
      if (status >= 200 && status < 300) {
        const empty: BulkCsvResult = { total_rows: 0, imported_rows: 0, failed_rows: 0, errors: [], products: [] };
        if (!text) return resolve(empty);
        try {
          resolve(JSON.parse(text) as BulkCsvResult);
        } catch {
          resolve(empty);
        }
        return;
      }
      let message = `HTTP ${status}`;
      if (text) {
        try {
          const j = JSON.parse(text) as {
            message?: string;
            error?: string;
            detail?: unknown;
          };
          if (typeof j.detail === "string") message = j.detail;
          else if (Array.isArray(j.detail))
            message = j.detail
              .map((d: { msg?: string }) => d?.msg ?? JSON.stringify(d))
              .join("; ");
          else message = j.message || j.error || text;
        } catch {
          message = text;
        }
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}


export type ApiProduct = {
  id: number;
  category_id: number;
  brand_id: number;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  ingredients: string;
  usage: string;
  origin: string;
  skin_type: string;
  volume: string;
  price: number;
  original_price: number;
  stock: number;
  rating: number;
  review_count: number;
  discount_percent: number;
  images: string[];
  is_featured: number;
  is_best_seller: number;
  is_new: number;
};

export type ProductPayload = {
  category_id: number;
  brand_id: number;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  ingredients: string;
  usage: string;
  origin: string;
  skin_type: string;
  volume: string;
  price: number;
  original_price: number;
  stock: number;
  rating: number;
  review_count: number;
  discount_percent: number;
  images: string[];
  is_featured: number;
  is_best_seller: number;
  is_new: number;
};

export type PageQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  category_id?: number | string;
  brand_id?: number | string;
};

export async function fetchProducts({
  page = 1,
  pageSize = 10,
  q,
  category_id,
  brand_id,
}: PageQuery = {}): Promise<PaginatedResponse<ApiProduct>> {
  const res = await apiRequest<unknown>("/admin/products", {
    auth: true,
    query: {
      page,
      page_size: pageSize,
      q: q?.trim() || undefined,
      category_id:
        category_id !== undefined && category_id !== "" ? String(category_id) : undefined,
      brand_id: brand_id !== undefined && brand_id !== "" ? String(brand_id) : undefined,
    },
  });
  return normalizePaginated<ApiProduct>(res, pageSize);
}

export async function createProduct(payload: ProductPayload): Promise<void> {
  await apiRequest("/admin/products", { method: "POST", body: payload, auth: true });
}

export async function updateProduct(id: number | string, payload: ProductPayload): Promise<void> {
  await apiRequest(`/admin/products/${id}`, { method: "PUT", body: payload, auth: true });
}

export async function deleteProduct(id: number | string): Promise<void> {
  await apiRequest(`/admin/products/${id}`, { method: "DELETE", auth: true });
}

export type ProductHighlights = {
  featured: ApiProduct[];
  best_sellers: ApiProduct[];
  new_arrivals: ApiProduct[];
  newest: ApiProduct[];
};

export const PLACEHOLDER_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=60";

export async function fetchProductHighlights(): Promise<ProductHighlights> {
  const res = await apiRequest<Partial<ProductHighlights>>("/products/highlights");
  return {
    featured: Array.isArray(res?.featured) ? res!.featured! : [],
    best_sellers: Array.isArray(res?.best_sellers) ? res!.best_sellers! : [],
    new_arrivals: Array.isArray(res?.new_arrivals) ? res!.new_arrivals! : [],
    newest: Array.isArray(res?.newest) ? res!.newest! : [],
  };
}

import type { Product } from "./products";

export function adaptApiProduct(p: ApiProduct): Product {
  const image = p.images && p.images.length > 0 ? p.images[0] : PLACEHOLDER_PRODUCT_IMAGE;
  return {
    id: String(p.id),
    slug: p.slug ?? "",
    name: p.name,
    brand: "",
    category: "",
    price: Number(p.price) || 0,
    oldPrice: p.original_price && Number(p.original_price) > Number(p.price) ? Number(p.original_price) : undefined,
    image,
    images: p.images ?? [],
    description: p.description ?? "",
    ingredients: p.ingredients ?? "",
    benefits: [],
    usage: p.usage ?? "",
    skinType: p.skin_type ?? "",
    origin: p.origin ?? "",
    volume: p.volume ?? "",
    expiration: "",
    manufactureDate: "",
    stock: Number(p.stock) || 0,
    rating: Number(p.rating) || 0,
    reviewCount: Number(p.review_count) || 0,
    specifications: [],
    bestSeller: !!p.is_best_seller,
    newArrival: !!p.is_new,
    flashSale: !!p.is_featured,
  };
}

export async function fetchProductDetail(slug: string, id: string | number): Promise<ApiProduct> {
  return apiRequest<ApiProduct>(`/products/${slug}/${id}`);
}

export type ProductFilterParams = {
  slug?: string;
  min_price?: number;
  max_price?: number;
  brands?: number[];
  page?: number;
  page_size?: number;
  q?: string;
};

export async function fetchProductFilter(params: ProductFilterParams = {}): Promise<PaginatedResponse<ApiProduct>> {
  const usp = new URLSearchParams();
  if (params.slug) usp.set("slug", params.slug);
  if (params.min_price != null) usp.set("min_price", String(params.min_price));
  if (params.max_price != null) usp.set("max_price", String(params.max_price));
  if (params.brands && params.brands.length > 0) {
    params.brands.forEach((b) => usp.append("brands", String(b)));
  }
  const qTrim = params.q?.trim();
  if (qTrim) usp.set("q", qTrim);
  usp.set("page", String(params.page ?? 1));
  usp.set("page_size", String(params.page_size ?? 12));
  const qs = usp.toString();
  const res = await apiRequest<unknown>(`/products/product-filter${qs ? `?${qs}` : ""}`);
  return normalizePaginated<ApiProduct>(res, params.page_size ?? 12);
}

export function slugifyVN(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
