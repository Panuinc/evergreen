import { get, put } from "@/lib/apiClient";

export async function getProfile() {
  return get("/api/profile");
}

export async function changePassword(currentPassword, newPassword) {
  return put("/api/profile/changePassword", {
    currentPassword,
    newPassword,
  });
}
