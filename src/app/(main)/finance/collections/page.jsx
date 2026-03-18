import CollectionsClient from "@/modules/finance/CollectionsClient";

export default async function CollectionsPage() {
  // Collections page relies heavily on client-side hooks (useCollections)
  // with AI streaming, follow-up mutations, and complex form state.
  // Keep data fetching in the client hook; this page is a Server Component.
  return <CollectionsClient />;
}
