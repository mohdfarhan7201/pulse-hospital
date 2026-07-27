import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  Confirmed: "bg-emerald-100 text-emerald-700",
  Completed: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Waiting: "bg-amber-100 text-amber-700",
  "In Consultation": "bg-sky-100 text-sky-700",
  Cancelled: "bg-rose-100 text-rose-700",
  Paid: "bg-emerald-100 text-emerald-700",
  Active: "bg-emerald-100 text-emerald-700",
  "On Leave": "bg-amber-100 text-amber-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold",
        styles[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
