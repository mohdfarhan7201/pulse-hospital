import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IndianRupee, Receipt } from "lucide-react";

import { getBillingFn } from "@/lib/api";
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

export const Route = createFileRoute("/admin/billing")({
  component: BillingPage,
});

const rupee = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["billing"],
    queryFn: () => getBillingFn(),
  });

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading invoices…
                </TableCell>
              </TableRow>
            )}
            {data?.invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.id.toUpperCase()}</TableCell>
                <TableCell>{inv.patientName}</TableCell>
                <TableCell className="text-muted-foreground">{inv.date}</TableCell>
                <TableCell>{rupee.format(inv.amount)}</TableCell>
                <TableCell>
                  <StatusBadge status={inv.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
