import { apiRequest, normalizePaginated, type PaginatedResponse } from "./api-client";

export type ApiBrand = {
  id: number;
  name: string;
  description?: string;
};

export type BrandPayload = {
  name: string;
  description: string;
};

export type PageQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export async function fetchBrands({
  page = 1,
  pageSize = 10,
  q,
}: PageQuery = {}): Promise<PaginatedResponse<ApiBrand>> {
  const res = await apiRequest<unknown>("/admin/brands", {
    auth: true,
    query: { page, page_size: pageSize, q: q?.trim() || undefined },
  });
  return normalizePaginated<ApiBrand>(res, pageSize);
}

export async function createBrand(payload: BrandPayload): Promise<void> {
  await apiRequest("/admin/brands", { method: "POST", body: payload, auth: true });
}

export async function updateBrand(id: number | string, payload: BrandPayload): Promise<void> {
  await apiRequest(`/admin/brands/${id}`, { method: "PUT", body: payload, auth: true });
}

export async function deleteBrand(id: number | string): Promise<void> {
  await apiRequest(`/admin/brands/${id}`, { method: "DELETE", auth: true });
}
