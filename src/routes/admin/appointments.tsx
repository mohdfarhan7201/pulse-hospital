import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  listAllAppointmentsFn,
  updateAppointmentStatusFn,
  type AppointmentStatus,
} from "@/lib/api";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/admin/appointments")({
  component: AppointmentsPage,
});

const STATUS_OPTIONS: AppointmentStatus[] = [
  "Confirmed",
  "Pending",
  "In Consultation",
  "Waiting",
  "Completed",
  "Cancelled",
];

function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");

  const { data: appointments, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["all-appointments"],
    queryFn: () => listAllAppointmentsFn(),
  });

  const filtered = (appointments ?? []).filter((a) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      a.patientName.toLowerCase().includes(q) ||
      a.doctorName.toLowerCase().includes(q) ||
      a.department.toLowerCase().includes(q) ||
      a.address.toLowerCase().includes(q) || a.state.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatusFn({ data: vars }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["all-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success(`Appointment status updated to "${vars.status}"!`);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Appointments</h2>
        <p className="text-sm text-muted-foreground">
          Every appointment booked across the hospital.
        </p>
      </div>

      <Card className="p-5">
        {/* Filters row */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              id="appointment-search"
              placeholder="Search by patient, doctor, department or address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Location / Address</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading appointments…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                  No appointments match your filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.patientName}
                  <p className="text-xs font-normal text-muted-foreground">
                    {a.age} yrs, {a.gender}
                  </p>
                </TableCell>
                <TableCell>{a.doctorName}</TableCell>
                <TableCell>{a.department}</TableCell>
                <TableCell className="text-muted-foreground">
                  {a.date}, {a.time}
                </TableCell>
                <TableCell className="text-muted-foreground"><div className="truncate max-w-[200px]" title={`${a.address}, ${a.state}, ${a.country}`}>{a.address}, {a.state}, {a.country}</div></TableCell>
                <TableCell>
                  <Select
                    value={a.status}
                    onValueChange={(status) =>
                      updateStatus.mutate({ id: a.id, status: status as AppointmentStatus })
                    }
                  >
                    <SelectTrigger className="h-8 w-[150px]">
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
