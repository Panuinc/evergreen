export async function generateMetadata({ params }) {
  const { no } = await params;
  return {
    title: `Sales Order - ${decodeURIComponent(no)} | EverGreen`,
  };
}

export default function SalesOrderDetailLayout({ children }) {
  return children;
}
