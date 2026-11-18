import { apiRequest, normalizePaginated, type PaginatedResponse } from "./api-client";

export type ApiUser = {
  id: number;
  name: string;
  username: string;
  is_admin: boolean;
  created_at: string;
};

export type CreateUserPayload = {
  name: string;
  username: string;
  password: string;
  is_admin: boolean;
};

export type PageQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
};

export async function fetchUsers({
  page = 1,
  pageSize = 10,
  q,
}: PageQuery = {}): Promise<PaginatedResponse<ApiUser>> {
  const res = await apiRequest<unknown>("/admin/users", {
    auth: true,
    query: { page, page_size: pageSize, q: q?.trim() || undefined },
  });
  return normalizePaginated<ApiUser>(res, pageSize);
}

export async function createUser(payload: CreateUserPayload): Promise<ApiUser> {
  return apiRequest<ApiUser>("/admin/users", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export type UpdateUserPayload = {
  name: string;
  username: string;
  password?: string;
  is_admin: boolean;
};

export async function updateUser(id: number, payload: UpdateUserPayload): Promise<ApiUser> {
  return apiRequest<ApiUser>(`/admin/users/${id}`, {
    method: "PUT",
    body: payload,
    auth: true,
  });
}

export async function deleteUser(id: number): Promise<void> {
  await apiRequest(`/admin/users/${id}`, { method: "DELETE", auth: true });
}
