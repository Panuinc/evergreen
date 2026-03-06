import { Construction } from "lucide-react";

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Construction size={64} className="text-muted-foreground" />
      <h2 className="text-2xl font-semibold text-muted-foreground">Coming Soon</h2>
      {title && <p className="text-muted-foreground">{title}</p>}
    </div>
  );
}
