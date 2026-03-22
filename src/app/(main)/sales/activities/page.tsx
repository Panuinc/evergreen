import { api } from "@/lib/api.server";
import ActivitiesClient from "@/modules/sales/activitiesClient";
import type { SalesActivity } from "@/modules/sales/types";

export default async function ActivitiesPage() {
  const activities = await api<SalesActivity[]>("/api/sales/activities");

  return <ActivitiesClient initialActivities={activities || []} />;
}
