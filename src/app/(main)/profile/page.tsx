import { api } from "@/lib/api.server";
import ProfileClient from "@/modules/profile/profileClient";

export default async function ProfilePage() {
  const profile = await api("/api/profile");

  return <ProfileClient initialProfile={profile} />;
}
