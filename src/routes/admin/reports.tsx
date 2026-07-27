import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { getAdminReportsFn } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarDays, Stethoscope, Users } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { data, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["admin-reports"],
    queryFn: () => getAdminReportsFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Reports</h2>
        <p className="text-sm text-muted-foreground">
          Hospital-wide performance, generated live from current records.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <StatCard
          icon={<Stethoscope className="h-5 w-5" />}
          label="Total Doctors"
          value={isLoading ? "…" : data?.totalDoctors}
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-5">
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

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Doctor Workload</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Appts</TableHead>
                <TableHead className="text-right">Patients</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.doctorLoad.map((d) => (
                <TableRow key={d.name}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-muted-foreground">{d.department}</TableCell>
                  <TableCell className="text-right">{d.appointments}</TableCell>
                  <TableCell className="text-right">{d.patients}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
