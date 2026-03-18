/**
 * Paginated fetch utility for Supabase queries.
 * Supabase has a default row limit of 1000 — this helper loops
 * with .range() so every row is returned.
 *
 * @param {SupabaseQueryBuilder} query
 *   A Supabase query builder with .select(), filters, and .order()
 *   already applied — but NOT .range().
 * @param {number} [pageSize=1000]
 * @returns {Promise<{ data: any[] | null, error: any }>}
 *
 * @example
 *   const { data, error } = await fetchAll(
 *     supabase.from("hrEmployee").select("*").order("hrEmployeeCreatedAt", { ascending: false })
 *   );
 */
export async function fetchAll(query, pageSize = 1000) {
  let allData = [];
  let from = 0;

  while (true) {
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) return { data: null, error };
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return { data: allData, error: null };
}
