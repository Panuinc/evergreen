import { get } from "@/lib/apiClient";

export async function getConfigCheck() {
  return get("/api/configCheck");
}
