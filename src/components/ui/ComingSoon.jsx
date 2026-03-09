import { Construction } from "lucide-react";

export default function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <Construction size={64} className="text-muted-foreground" />
      <p className="text-xs font-light text-muted-foreground">Coming Soon</p>
      {title && <p className="text-muted-foreground">{title}</p>}
    </div>
  );
}
