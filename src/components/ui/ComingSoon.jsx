import { Construction } from "lucide-react";

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Construction size={64} className="text-default-300" />
      <h2 className="text-2xl font-bold text-default-400">Coming Soon</h2>
      {title && <p className="text-default-400">{title}</p>}
    </div>
  );
}
