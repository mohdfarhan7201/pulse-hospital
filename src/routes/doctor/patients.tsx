import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, Phone, Mail, Calendar, UserCheck, Users, Filter } from "lucide-react";

import { listMyPatientsFn } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
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

export const Route = createFileRoute("/doctor/patients")({
  component: MyPatientsPage,
});

function MyPatientsPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const { data: patients = [], isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["my-patients"],
    queryFn: () => listMyPatientsFn(),
  });

  const deptOptions = useMemo(() => {
    const set = new Set<string>(["Diagnostics"]);
    patients.forEach((p) => {
      if (p.department && p.department !== "Cardiology") set.add(p.department);
    });
    return Array.from(set);
  }, [patients]);

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.department && p.department.toLowerCase().includes(q));
    const matchesDept = deptFilter === "all" || (p.department || "Diagnostics") === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Patient Directory</h2>
          <p className="text-sm text-muted-foreground">
            Complete list of patients registered under your clinical care.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs">
            <Users className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Total Patients: <span className="ml-1 font-bold">{patients.length}</span>
          </Badge>
        </div>
      </div>

      <Card className="p-4 sm:p-5">
        {/* Search & Filter Bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v)}>
              <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All Departments" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {deptOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {search && (
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {patients.length} patients
            </p>
          )}
        </div>

        {/* Patients Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Appointments</TableHead>
              <TableHead>Last Visit</TableHead>
              <TableHead>Latest Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Loading patient directory…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  {search ? "No patients match your search criteria." : "No patients found in your records."}
                </TableCell>
              </TableRow>
            )}

            {filtered.map((p: any) => {
              const initials = p.name
                ? p.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "PT";

              return (
                <TableRow key={p.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border/80">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.age} yrs, {p.gender}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">
                    {p.phone ? (
                      <a
                        href={`tel:${p.phone.replace(/\D/g, "")}`}
                        className="flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{p.phone}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-xs">No phone</span>
                    )}
                    {p.email && (
                      <a
                        href={`mailto:${p.email}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
                      >
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">{p.email}</span>
                      </a>
                    )}
                  </TableCell>

                  <TableCell className="text-sm font-medium">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.department === "Diagnostics"
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40"
                          : "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/40"
                      }`}
                    >
                      {p.department || "Diagnostics"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-semibold">
                      {p.totalAppointments ?? 1} visit{(p.totalAppointments ?? 1) > 1 ? "s" : ""}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{p.latestDate || p.lastVisit || "N/A"}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {p.latestStatus ? (
                      <StatusBadge status={p.latestStatus} />
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        <UserCheck className="mr-1 h-3 w-3" /> Active
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
