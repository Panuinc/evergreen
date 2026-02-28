"use client";

import { useProfilePage } from "@/hooks/profile/useProfilePage";
import ProfileView from "@/components/profile/ProfileView";

export default function ProfilePage() {
  const props = useProfilePage();

  return <ProfileView {...props} />;
}
