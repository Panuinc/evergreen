import { api } from "@/lib/api.server";
import ActivitiesClient from "@/modules/sales/ActivitiesClient";

export default async function ActivitiesPage() {
  const activities = await api("/api/sales/activities");

  return <ActivitiesClient initialActivities={activities || []} />;
}
