import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

const colorMap = {
  violet: "bg-violet-100 text-violet-600",
  emerald: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-600",
  sky: "bg-sky-100 text-sky-600",
} as const;

export function StatCard({
  icon,
  label,
  value,
  sublabel,
  color = "violet",
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  sublabel?: string;
  color?: keyof typeof colorMap;
}) {
  return (
    <Card className="p-5">
      <div className={cn("mb-4 grid h-11 w-11 place-items-center rounded-xl", colorMap[color])}>
        {icon}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {sublabel && <p className="mt-1 text-xs font-medium text-emerald-600">{sublabel}</p>}
    </Card>
  );
}
