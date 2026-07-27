import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";

import { getMyScheduleFn } from "@/lib/api";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/doctor/schedule")({
  component: SchedulePage,
});

function SchedulePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-schedule"],
    queryFn: () => getMyScheduleFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Schedule</h2>
        <p className="text-sm text-muted-foreground">Your consulting hours for the coming days.</p>
      </div>

      <Card className="max-w-xl p-5">
        {isLoading && <p className="text-sm text-muted-foreground">Loading schedule…</p>}
        <ul className="divide-y">
          {data?.days.map((d, i) => (
            <li key={d.label} className="flex items-center gap-4 py-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-medium">{d.label}</p>
                <p className="text-sm text-muted-foreground">{d.hours}</p>
              </div>
              {i === 0 && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Today
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
