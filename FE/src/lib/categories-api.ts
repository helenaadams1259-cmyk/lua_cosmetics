import { apiRequest, normalizePaginated, type PaginatedResponse } from "./api-client";

export type ApiCategory = {
  id: string | number;
  name: string;
  slug: string;
};

export type CategoryPayload = {
  name: string;
  slug: string;
};

export type PageQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export async function fetchCategories({
  page = 1,
  pageSize = 10,
  q,
}: PageQuery = {}): Promise<PaginatedResponse<ApiCategory>> {
  const res = await apiRequest<unknown>("/admin/categories", {
    auth: true,
    query: { page, page_size: pageSize, q: q?.trim() || undefined },
  });
  return normalizePaginated<ApiCategory>(res, pageSize);
}

export async function createCategory(payload: CategoryPayload): Promise<void> {
  await apiRequest("/admin/categories", { method: "POST", body: payload, auth: true });
}

export async function updateCategory(id: string | number, payload: CategoryPayload): Promise<void> {
  await apiRequest(`/admin/categories/${id}`, { method: "PUT", body: payload, auth: true });
}

export async function deleteCategory(id: string | number): Promise<void> {
  await apiRequest(`/admin/categories/${id}`, { method: "DELETE", auth: true });
}
