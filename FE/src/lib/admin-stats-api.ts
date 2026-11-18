import { apiRequest } from "./api-client";

export type AdminStats = {
  users: number;
  orders: number;
  categories: number;
  brands: number;
};

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiRequest<AdminStats>("/admin/stats", { auth: true });
}
