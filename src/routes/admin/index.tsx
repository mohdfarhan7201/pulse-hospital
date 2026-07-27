import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Stethoscope, Users } from "lucide-react";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getAdminOverviewFn } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({
  component: AdminOverviewPage,
});

const DEPT_COLORS = ["#7c3aed", "#0891b2", "#f59e0b", "#e11d48", "#94a3b8"];

function AdminOverviewPage() {
  const { data, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["admin-overview"],
    queryFn: () => getAdminOverviewFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Welcome back, Admin!</h2>
        <p className="text-sm text-muted-foreground">Here's what's happening in the hospital.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Stethoscope className="h-5 w-5" />}
          label="Total Doctors"
          value={isLoading ? "…" : data?.totalDoctors}
          sublabel="Active doctors"
          color="violet"
        />
        <StatCard
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Today's Appointments"
          value={isLoading ? "…" : data?.todaysAppointmentsCount}
          sublabel="Scheduled for today"
          color="emerald"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Patients"
          value={isLoading ? "…" : data?.patientsTotal}
          sublabel="Registered patients"
          color="amber"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Appointments Overview</h3>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              This Week
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.week ?? []}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} width={28} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  stroke="oklch(0.42 0.18 265)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "oklch(0.42 0.18 265)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold">Appointments by Department</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.byDepartment ?? []}
                  dataKey="percent"
                  nameKey="department"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {(data?.byDepartment ?? []).map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2">
            {(data?.byDepartment ?? []).map((d, i) => (
              <li key={d.department} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: DEPT_COLORS[i % DEPT_COLORS.length] }}
                  />
                  {d.department}
                </span>
                <span className="font-medium text-muted-foreground">{d.percent}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Recent Appointments</h3>
          <Link
            to="/admin/appointments"
            className="text-sm font-medium text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Name</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data?.recentAppointments ?? []).map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.patientName}</TableCell>
                <TableCell>{a.doctorName}</TableCell>
                <TableCell>{a.department}</TableCell>
                <TableCell className="text-muted-foreground">
                  {a.date}, {a.time}
                </TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
