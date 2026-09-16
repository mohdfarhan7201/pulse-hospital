import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  CalendarDays,
  Users,
  CheckCircle2,
  IndianRupee,
  Printer,
  Search,
  Activity,
  UserCheck,
  TrendingUp,
} from "lucide-react";

import { getAdminReportsFn } from "@/lib/api";
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

export const Route = createFileRoute("/doctor/reports")({
  component: DoctorReportsPage,
});

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const STATUS_CONFIG: Record<string, { label: string; barColor: string; textColor: string }> = {
  Completed: { label: "Completed", barColor: "bg-emerald-600", textColor: "text-emerald-700 dark:text-emerald-400" },
  "In Consultation": { label: "In Consultation", barColor: "bg-sky-500", textColor: "text-sky-700 dark:text-sky-400" },
  Waiting: { label: "Waiting Room", barColor: "bg-amber-500", textColor: "text-amber-700 dark:text-amber-400" },
  Confirmed: { label: "Confirmed", barColor: "bg-blue-500", textColor: "text-blue-700 dark:text-blue-400" },
  Pending: { label: "Pending", barColor: "bg-yellow-500", textColor: "text-yellow-700 dark:text-yellow-400" },
  Cancelled: { label: "Cancelled", barColor: "bg-rose-500", textColor: "text-rose-700 dark:text-rose-400" },
};

function DoctorReportsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["reports"],
    queryFn: () => getAdminReportsFn(),
  });

  const totalAppts = data?.totalAppointments ?? 0;

  const filteredConsultations = (data?.recentConsultations ?? []).filter((c) => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      c.patientName.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Print Only Official Letterhead */}
      <div className="hidden print:block border-b-2 border-emerald-700 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-emerald-800">
              {data?.hospitalName || "PULSE HEART CENTRE"}
            </h1>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">
              Department of Cardiology &amp; Diagnostics • Clinical &amp; OPD Consultation Report
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Station Road, Near Golghar, Gorakhpur, UP • Helpline: {data?.helplinePhone || "+91 98765 43210"}
            </p>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold text-gray-900 block text-sm">Dr. Prakash Chand Shahi</span>
            <span className="text-gray-600 block">Director &amp; Senior Cardiologist</span>
            <span className="text-[10px] text-gray-400 block mt-1">
              Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Doctor Consultation Reports
          </h2>
          <p className="text-sm text-muted-foreground">
            Dr. Prakash Chand Shahi • Department of Cardiology &amp; Diagnostics
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs shadow-sm hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* 4 Key Performance Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Total Consultations"
          value={isLoading ? "…" : String(data?.totalAppointments ?? 0)}
          color="violet"
        />
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Patients"
          value={isLoading ? "…" : String(data?.totalPatients ?? 0)}
          color="emerald"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed Rate"
          value={isLoading ? "…" : `${data?.completionRate ?? 0}%`}
          sublabel={`${data?.statusCounts?.["Completed"] ?? 0} Completed`}
          color="sky"
        />
        <StatCard
          icon={<IndianRupee className="h-5 w-5" />}
          label="Total Revenue"
          value={isLoading ? "…" : rupee.format(data?.totalRevenue ?? 0)}
          sublabel={`${rupee.format(data?.paidRevenue ?? 0)} Collected`}
          color="amber"
        />
      </div>

      {/* 2-Column Summary: Status Breakdown & Revenue Collection */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Status Breakdown */}
        <Card className="p-5 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              <h3 className="font-semibold text-sm">Consultation Status Breakdown</h3>
            </div>
            <span className="text-xs text-muted-foreground">
              Total: {totalAppts} appointments
            </span>
          </div>

          <div className="space-y-3.5">
            {Object.entries(data?.statusCounts ?? {}).map(([status, count]) => {
              const cfg = STATUS_CONFIG[status] || {
                label: status,
                barColor: "bg-slate-400",
                textColor: "text-foreground",
              };
              const pct = totalAppts > 0 ? Math.round((count / totalAppts) * 100) : 0;

              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${cfg.textColor}`}>{cfg.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{count}</span>
                      <span className="text-[11px] text-muted-foreground w-10 text-right">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${cfg.barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Revenue Summary */}
        <Card className="p-5 shadow-sm border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h3 className="font-semibold text-sm">Revenue &amp; Fee Status</h3>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                Cardiology OPD
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium block">
                  Collected Amount
                </span>
                <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-300 block mt-2">
                  {rupee.format(data?.paidRevenue ?? 0)}
                </span>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">
                  Cleared payments
                </span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <span className="text-xs text-amber-700 dark:text-amber-400 font-medium block">
                  Pending Dues
                </span>
                <span className="text-2xl font-bold text-amber-800 dark:text-amber-300 block mt-2">
                  {rupee.format(data?.pendingRevenue ?? 0)}
                </span>
                <span className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1 block">
                  To be received
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground flex items-center justify-between">
            <span>Overall Consultation Fee Total:</span>
            <span className="font-bold text-foreground text-sm">{rupee.format(data?.totalRevenue ?? 0)}</span>
          </div>
        </Card>
      </div>

      {/* Consultation Records Table */}
      <Card className="shadow-sm border overflow-hidden print:shadow-none print:border-gray-300">
        <div className="p-4 border-b bg-muted/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">
              Patient Consultations Log ({filteredConsultations.length})
            </h3>
          </div>
          <div className="relative w-full sm:w-64 print:hidden">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search patient name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-32">Date &amp; Slot</TableHead>
              <TableHead>Patient Details</TableHead>
              <TableHead className="text-right w-36">Consultation Fee</TableHead>
              <TableHead className="text-center w-36">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                  Loading reports…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && filteredConsultations.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground text-xs">
                  No consultation records found.
                </TableCell>
              </TableRow>
            )}

            {filteredConsultations.map((item) => (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="font-medium text-xs text-foreground">{item.date}</div>
                  <div className="text-[11px] text-muted-foreground">{item.time}</div>
                </TableCell>
                <TableCell>
                  <div className="font-semibold text-xs text-foreground">{item.patientName}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {item.age} yrs • {item.gender}
                    {item.phone && ` • ${item.phone}`}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="font-bold text-xs text-foreground">
                    {rupee.format(item.amount)}
                  </div>
                  <div className="text-[10px]">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded font-semibold ${
                        item.paymentStatus === "Paid"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {item.paymentStatus}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <StatusBadge status={item.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
