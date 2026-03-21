export async function generateMetadata({ params }) {
  const { no } = await params;
  return {
    title: `Shipping Label - ${decodeURIComponent(no)} | EverGreen`,
  };
}

export default function ShippingLabelLayout({ children }) {
  return children;
}
