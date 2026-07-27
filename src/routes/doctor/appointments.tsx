import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Calendar, Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  listMyAppointmentsFn,
  updateAppointmentStatusFn,
  type AppointmentStatus,
} from "@/lib/api";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/doctor/appointments")({
  component: MyAppointmentsPage,
});

const STATUS_OPTIONS: AppointmentStatus[] = [
  "Confirmed",
  "Pending",
  "In Consultation",
  "Waiting",
  "Completed",
  "Cancelled",
];

function MyAppointmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");

  const { data: appointments = [], isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["my-appointments"],
    queryFn: () => listMyAppointmentsFn(),
  });
  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatusFn({ data: vars }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-overview"] });
      toast.success(`Appointment status updated to "${vars.status}"!`);
    },
  });

  const filtered = appointments.filter((a) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      a.patientName.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.reason.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === "Pending").length,
    confirmed: appointments.filter((a) => a.status === "Confirmed").length,
    completed: appointments.filter((a) => a.status === "Completed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">My Appointments</h2>
          <p className="text-sm text-muted-foreground">
            View, search, filter, and manage status for all appointments assigned to you.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs">
            Total: <span className="ml-1 font-bold">{counts.total}</span>
          </Badge>
          {counts.pending > 0 && (
            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 px-3 py-1 text-xs">
              Pending: <span className="ml-1 font-bold">{counts.pending}</span>
            </Badge>
          )}
          <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-xs">
            Confirmed: <span className="ml-1 font-bold">{counts.confirmed}</span>
          </Badge>
        </div>
      </div>

      <Card className="p-5">
        {/* Search & Filter Row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="doctor-appointment-search"
              placeholder="Search by patient name, ID, or notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="All statuses" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({appointments.length})</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Appointments Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient Details</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Date &amp; Slot</TableHead>
              <TableHead>Reason / Notes</TableHead>
              <TableHead className="w-[180px]">Status &amp; Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Loading appointments…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No appointments match your search or filter.
                </TableCell>
              </TableRow>
            )}

            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  <div className="text-sm font-bold text-foreground">{a.patientName}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.age} yrs, {a.gender}
                  </div>
                </TableCell>

                <TableCell className="text-sm font-medium">{a.department}</TableCell>

                <TableCell className="text-sm">
                  <div className="flex items-center gap-1.5 text-foreground font-medium">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>{a.date}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.time}</div>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {a.reason || "General Consultation"}
                </TableCell>

                <TableCell>
                  <Select
                    value={a.status}
                    onValueChange={(status) =>
                      updateStatus.mutate({ id: a.id, status: status as AppointmentStatus })
                    }
                  >
                    <SelectTrigger className="h-8 w-[160px]">
                      <SelectValue>
                        <StatusBadge status={a.status} />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
