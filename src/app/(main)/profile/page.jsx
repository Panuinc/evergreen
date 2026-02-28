"use client";

import { useProfilePage } from "@/modules/profile/hooks/useProfilePage";
import ProfileView from "@/modules/profile/components/ProfileView";

export default function ProfilePage() {
  const props = useProfilePage();

  return <ProfileView {...props} />;
}
