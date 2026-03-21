import { api } from "@/lib/api.server";
import ProfileClient from "@/modules/profile/profileClient";
import type { ProfileData } from "@/modules/profile/types";

export default async function ProfilePage() {
  const profile = await api<ProfileData>("/api/profile");

  return <ProfileClient initialProfile={profile} />;
}
