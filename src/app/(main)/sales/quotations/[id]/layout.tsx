export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `ใบเสนอราคา #${id} | EverGreen`,
  };
}

export default function QuotationDetailLayout({ children }) {
  return children;
}
