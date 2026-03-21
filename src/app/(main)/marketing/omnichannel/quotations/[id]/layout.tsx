export async function generateMetadata({ params }) {
  const { id } = await params;
  return {
    title: `Quotation #${id} | EverGreen`,
  };
}

export default function OmnichannelQuotationLayout({ children }) {
  return children;
}
