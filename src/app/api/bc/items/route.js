import { withAuth } from "@/app/api/_lib/auth";
import { bcODataGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const rows = await bcODataGet("Item_Card_Excel", {
      $filter: "Blocked eq false",
      $select:
        "No,Description,Type,Inventory,Unit_Price,Unit_Cost,Item_Category_Code,Gen_Prod_Posting_Group,Blocked,Base_Unit_of_Measure",
      $orderby: "No asc",
    });

    const data = rows.map((i) => ({
      id: i.No,
      number: i.No,
      displayName: i.Description,
      type: i.Type,
      inventory: i.Inventory,
      unitPrice: i.Unit_Price,
      unitCost: i.Unit_Cost,
      itemCategoryCode: i.Item_Category_Code,
      generalProductPostingGroupCode: i.Gen_Prod_Posting_Group,
      blocked: i.Blocked,
      baseUnitOfMeasure: i.Base_Unit_of_Measure,
    }));

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
