import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { IndianRupee, Receipt, Check, Clock, Eye, Printer, Download, X } from "lucide-react";
import { toast } from "sonner";

import { getBillingFn, updateInvoiceStatusFn, type InvoiceRecord } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/doctor/billing")({
  component: BillingPage,
});

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function BillingPage() {
  const queryClient = useQueryClient();
  const [selectedBill, setSelectedBill] = useState<InvoiceRecord | null>(null);

  const { data, isLoading } = useQuery({
    refetchInterval: 3000,
    queryKey: ["billing"],
    queryFn: () => getBillingFn(),
  });

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: "Paid" | "Pending" }) =>
      updateInvoiceStatusFn({ data: vars }),
    onSuccess: (_res, vars) => {
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-overview"] });
      toast.success(`Invoice status updated to "${vars.status}"!`);
      if (selectedBill && selectedBill.id === vars.id) {
        setSelectedBill({ ...selectedBill, status: vars.status });
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    },
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Billing &amp; Payments</h2>
        <p className="text-sm text-muted-foreground">Track invoices raised across the hospital.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          icon={<IndianRupee className="h-5 w-5" />}
          label="Total Collected"
          value={isLoading ? "…" : rupee.format(data?.totalPaid ?? 0)}
          color="emerald"
        />
        <StatCard
          icon={<Receipt className="h-5 w-5" />}
          label="Pending Payments"
          value={isLoading ? "…" : rupee.format(data?.totalPending ?? 0)}
          color="amber"
        />
      </div>

      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading invoices…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && (!data?.invoices || data.invoices.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No invoices found.
                </TableCell>
              </TableRow>
            )}

            {data?.invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  #{inv.id.toUpperCase()}
                </TableCell>
                <TableCell className="font-medium text-foreground">{inv.patientName}</TableCell>
                <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                <TableCell className="font-semibold">{rupee.format(inv.amount)}</TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() =>
                      updateStatus.mutate({
                        id: inv.id,
                        status: inv.status === "Paid" ? "Pending" : "Paid",
                      })
                    }
                    title="Click to toggle Paid / Pending"
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold cursor-pointer transition-all hover:opacity-80 active:scale-95 ${
                      inv.status === "Paid"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {inv.status === "Paid" ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Paid</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3" />
                        <span>Pending</span>
                      </>
                    )}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBill(inv)}
                    className="h-8 px-2.5 text-xs inline-flex items-center gap-1.5 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>View Bill</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Bill View & Download Modal */}
      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden [&>button]:text-white [&>button]:hover:text-white/80 [&>button]:z-20">
          {selectedBill && (
            <div className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
              {/* Header */}
              <div className="bg-emerald-600 text-white p-6 text-center relative">
                {/* Status Stamp on Top-Left (no overlap with Close X on Top-Right) */}
                <div className="absolute left-4 top-4">
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                      selectedBill.status === "Paid"
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "bg-amber-400 text-amber-950 shadow-sm"
                    }`}
                  >
                    {selectedBill.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold tracking-tight">
                  {data?.settings?.hospitalName || "Pulse Heart Centre"}
                </h3>
                <p className="text-xs text-emerald-100 mt-1">
                  {data?.settings?.tagline || "Advanced Cardiac Care & Multi-specialty Hospital"}
                </p>
                <p className="text-[11px] text-emerald-100/90 mt-0.5">
                  {data?.settings?.address || "Station Road, Near Golghar, Gorakhpur, UP 273001"}
                </p>
                <p className="text-[11px] text-emerald-100/90">
                  Helpline: {data?.settings?.helplinePhone || "+91 98765 43210"}
                </p>
              </div>

              {/* Bill Details */}
              <div className="p-6 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Invoice No:</span>
                    <span className="font-mono font-bold text-sm text-foreground">
                      #{selectedBill.id.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground block text-[11px]">Date:</span>
                    <span className="font-medium text-foreground">{selectedBill.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-muted/40 p-3 rounded-lg">
                  <div>
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider block">
                      Patient
                    </span>
                    <span className="font-bold text-sm text-foreground block mt-0.5">
                      {selectedBill.patientName}
                    </span>
                    {selectedBill.phone && (
                      <span className="text-muted-foreground block text-[11px]">
                        Phone: {selectedBill.phone}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider block">
                      Doctor / Consultant
                    </span>
                    <span className="font-bold text-sm text-foreground block mt-0.5">
                      Dr. Prakash Chand Shahi
                    </span>
                    <span className="text-muted-foreground block text-[11px]">
                      Director &amp; Cardiologist
                    </span>
                  </div>
                </div>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="py-2 px-3 text-left font-semibold">Service Particulars</th>
                        <th className="py-2 px-3 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2.5 px-3 font-medium">
                          {selectedBill.service || "OPD Consultation"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          {rupee.format(selectedBill.amount)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-t pt-2.5 space-y-1">
                  <div className="flex justify-between items-center text-sm font-bold text-foreground">
                    <span>Total Bill:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {rupee.format(selectedBill.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Payment Status:</span>
                    <span
                      className={`font-semibold ${
                        selectedBill.status === "Paid" ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {selectedBill.status}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground text-center pt-2 border-t">
                  * Computer generated hospital bill receipt - Pulse Heart Centre.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-muted/30 p-4 border-t flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBill(null)}
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handlePrint}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs shadow-sm"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Download / Print Bill</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
