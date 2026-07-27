import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Users } from "lucide-react";

import { getMyReportsFn } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/doctor/reports")({
  component: MyReportsPage,
});

function MyReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-reports"],
    queryFn: () => getMyReportsFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Reports &amp; Documents</h2>
        <p className="text-sm text-muted-foreground">
          A live summary of your consultations, generated from your appointment history.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Total Appointments"
          value={isLoading ? "…" : data?.totalAppointments}
          color="violet"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Patients"
          value={isLoading ? "…" : data?.totalPatients}
          color="emerald"
        />
      </div>

      <Card className="max-w-xl p-5">
        <h3 className="mb-4 font-semibold">Appointments by Status</h3>
        <ul className="space-y-3">
          {Object.entries(data?.statusCounts ?? {}).map(([status, count]) => (
            <li key={status} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{status}</span>
              <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
