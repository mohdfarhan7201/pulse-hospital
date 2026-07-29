import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Clock, Users } from "lucide-react";

import { getDoctorOverviewFn } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/doctor/")({
  component: DoctorOverviewPage,
});

function DoctorOverviewPage() {
  const { user } = useRouteContext({ from: "/doctor" });
  const { data, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["doctor-overview"],
    queryFn: () => getDoctorOverviewFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Welcome back, {user.name.replace(/^Dr\.?\s*/, "Dr. ")}!
        </h2>
        <p className="text-sm text-muted-foreground">
          Here is your appointment summary for today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Today's Appointments"
          value={isLoading ? "…" : data?.todaysAppointmentsCount}
          color="violet"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Upcoming"
          value={isLoading ? "…" : data?.upcomingCount}
          sublabel={data?.nextUpcomingTime ? `Next: ${data.nextUpcomingTime}` : undefined}
          color="amber"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed"
          value={isLoading ? "…" : data?.completedCount}
          color="sky"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Waiting Patients"
          value={isLoading ? "…" : data?.waitingCount}
          sublabel="Currently in queue"
          color="rose"
        />
      </div>

      {/* Main Content: Today's Appointments */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-base">Today's Appointments</h3>
            <Link
              to="/doctor/appointments"
              className="text-sm font-medium text-primary hover:underline"
            >
              View All
            </Link>
          </div>
          <ul className="divide-y">
            {(data?.todaysAppointments ?? []).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <span className="w-20 shrink-0 text-xs font-semibold text-muted-foreground">
                  {a.time}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{a.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.age} yrs, {a.gender} · {a.department}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </li>
            ))}
            {!isLoading && (data?.todaysAppointments ?? []).length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No appointments scheduled for today.
              </div>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
