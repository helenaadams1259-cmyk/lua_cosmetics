import { apiRequest } from "./api-client";

export type PublicCategory = {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  created_at?: string;
};

export type PublicBrand = {
  id: number;
  name: string;
  logo?: string | null;
  description?: string | null;
};

function toArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const obj = (res ?? {}) as { data?: T[] };
  return Array.isArray(obj.data) ? obj.data : [];
}

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
  const res = await apiRequest<unknown>("/categories");
  return toArray<PublicCategory>(res);
}

export async function fetchPublicBrands(): Promise<PublicBrand[]> {
  const res = await apiRequest<unknown>("/brands");
  return toArray<PublicBrand>(res);
}
