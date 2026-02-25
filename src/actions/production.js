import { get } from "@/lib/apiClient";

export async function getBcProduction() {
  return get("/api/bc/production");
}
