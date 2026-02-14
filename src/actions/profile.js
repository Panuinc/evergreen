import { get, put } from "@/lib/api-client";

export async function getProfile() {
  return get("/api/profile");
}

export async function changePassword(currentPassword, newPassword) {
  return put("/api/profile/change-password", {
    currentPassword,
    newPassword,
  });
}
