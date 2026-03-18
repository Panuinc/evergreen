import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { data, error } = await fetchAll(auth.supabase
      .from("labelDesign")
      .select("*")
      .order("labelDesignUpdatedAt", { ascending: false }));

    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json(
      { error: "Failed to load label designs" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name =
    typeof body.labelDesignName === "string"
      ? body.labelDesignName.slice(0, 200)
      : null;
  if (!name)
    return Response.json({ error: "Name is required" }, { status: 400 });

  const insert = {
    labelDesignName: name,
    labelDesignWidth: Number(body.labelDesignWidth) || 100,
    labelDesignHeight: Number(body.labelDesignHeight) || 30,
    labelDesignPreset: body.labelDesignPreset || "custom",
    labelDesignElements: body.labelDesignElements || [],
    labelDesignCreatedBy: auth.session?.user?.id || null,
  };

  try {
    const { data, error } = await auth.supabase
      .from("labelDesign")
      .insert(insert)
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch {
    return Response.json(
      { error: "Failed to create label design" },
      { status: 500 },
    );
  }
}
