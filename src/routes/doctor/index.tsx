import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { CalendarClock, CheckCircle2, Clock, Users, Calendar } from "lucide-react";

import { getDoctorOverviewFn, type AppointmentRecord } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/doctor/")({
  component: DoctorOverviewPage,
});

function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatFriendlyDate(isoDate: string): string {
  try {
    const parts = isoDate.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    return isoDate;
  } catch {
    return isoDate;
  }
}

function DoctorOverviewPage() {
  const { user } = useRouteContext({ from: "/doctor" });
  const todayIso = useMemo(() => getTodayIso(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const { data, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["doctor-overview", selectedDate],
    queryFn: () => getDoctorOverviewFn({ data: { date: selectedDate } }),
  });

  const isToday = selectedDate === todayIso;

  const appointments: AppointmentRecord[] = useMemo(() => {
    if (!data) return [];
    if (data.selectedAppointments && data.targetDate === selectedDate) {
      return data.selectedAppointments;
    }
    return (data.allAppointments ?? []).filter((a) => a.date === selectedDate);
  }, [data, selectedDate]);

  const upcomingCount = appointments.filter(
    (a) => a.status === "Confirmed" || a.status === "Pending"
  ).length;
  const completedCount = appointments.filter((a) => a.status === "Completed").length;
  const waitingCount = appointments.filter((a) => a.status === "Waiting").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Welcome back, {user.name.replace(/^Dr\.?\s*/, "Dr. ")}!
        </h2>
        <p className="text-sm text-muted-foreground">
          Here is your appointment summary for {isToday ? "today" : formatFriendlyDate(selectedDate)}.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label={isToday ? "Today's Appointments" : `Appointments (${formatFriendlyDate(selectedDate)})`}
          value={isLoading ? "…" : appointments.length}
          color="violet"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Upcoming"
          value={isLoading ? "…" : upcomingCount}
          sublabel={data?.nextUpcomingTime ? `Next: ${data.nextUpcomingTime}` : undefined}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={isLoading ? "…" : completedCount}
          color="sky"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Waiting Patients"
          value={isLoading ? "…" : waitingCount}
          sublabel="Currently in queue"
          color="rose"
        />
      </div>

      {/* Appointments Card with Date Filter */}
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">
              {isToday ? "Today's Appointments" : `Appointments (${formatFriendlyDate(selectedDate)})`}
            </h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {appointments.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Clean Date Filter Input */}
            <div className="flex items-center gap-1.5 border rounded-md px-2 py-1 bg-background text-xs">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="h-6 w-32 border-0 p-0 text-xs shadow-none focus-visible:ring-0 cursor-pointer"
              />
            </div>

            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(todayIso)}
                className="h-8 text-xs font-medium"
              >
                Today
              </Button>
            )}

            <Link
              to="/doctor/appointments"
              className="text-sm font-medium text-primary hover:underline ml-2"
            >
              View All
            </Link>
          </div>
        </div>

        {/* Clean Appointments Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Time</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right w-28">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((a: AppointmentRecord) => (
              <TableRow key={a.id}>
                <TableCell className="text-xs font-semibold text-muted-foreground">
                  {a.time || "10:00 AM"}
                </TableCell>
                <TableCell>
                  <div className="text-sm font-semibold">{a.patientName}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.age} yrs, {a.gender}
                    {a.phone ? ` · ${a.phone}` : ""}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-medium">
                  {a.department}
                </TableCell>
                <TableCell className="text-right">
                  <StatusBadge status={a.status} />
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                  No appointments scheduled for {isToday ? "today" : formatFriendlyDate(selectedDate)}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
