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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  const [confirmAppt, setConfirmAppt] = useState<any>(null);
  const [timeInput, setTimeInput] = useState("10:00 AM");
  const [tokenInput, setTokenInput] = useState("01");

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: AppointmentStatus; time?: string; tokenNo?: string }) =>
      updateAppointmentStatusFn({ data: vars }),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["all-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success(`Appointment status updated to "${vars.status}"!`);
      setConfirmAppt(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleStatusChange = (a: any, status: string) => {
    if (status === "Confirmed") {
      setConfirmAppt(a);
      setTimeInput("10:00 AM");
      setTokenInput("01");
    } else {
      updateStatus.mutate({ id: a.id, status: status as AppointmentStatus });
    }
  };

  const submitConfirm = () => {
    if (!confirmAppt) return;
    updateStatus.mutate({
      id: confirmAppt.id,
      status: "Confirmed",
      time: timeInput,
      tokenNo: tokenInput,
    });
  };

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
                    onValueChange={(status) => handleStatusChange(a, status)}
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

      <Dialog open={!!confirmAppt} onOpenChange={(o) => !o && setConfirmAppt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Appointment</DialogTitle>
            <DialogDescription>
              Please allot a time and token number for {confirmAppt?.patientName}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Allotted Time</label>
              <Input
                value={timeInput}
                onChange={(e) => setTimeInput(e.target.value)}
                placeholder="e.g. 10:30 AM"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Token Number</label>
              <Input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="e.g. 05"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAppt(null)}>Cancel</Button>
            <Button onClick={submitConfirm} disabled={updateStatus.isPending}>
              Confirm Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
