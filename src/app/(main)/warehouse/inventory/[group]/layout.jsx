export async function generateMetadata({ params }) {
  const { group } = await params;
  return {
    title: `${decodeURIComponent(group)} - สินค้าคงคลัง | EverGreen`,
  };
}

export default function InventoryGroupLayout({ children }) {
  return children;
}
