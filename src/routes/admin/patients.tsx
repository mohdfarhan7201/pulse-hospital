import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useState } from "react";

import { listPatientsFn } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/admin/patients")({
  component: PatientsPage,
});

function PatientsPage() {
  const [search, setSearch] = useState("");

  const { data: patients, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["patients"],
    queryFn: () => listPatientsFn(),
  });

  const filtered = (patients ?? []).filter((p) => {
    const q = search.toLowerCase();
    return (
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.phone.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      p.doctorName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Patients</h2>
        <p className="text-sm text-muted-foreground">Every patient registered at the hospital.</p>
      </div>

      <Card className="p-5">
        {/* Search */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="patient-search"
            placeholder="Search by name, email, phone, department or doctor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Primary Doctor</TableHead>
              <TableHead>Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading patients…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  {search ? `No patients found for "${search}"` : "No patients registered yet."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {p.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.age} yrs, {p.gender}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <p>{p.phone}</p>
                  <p>{p.email}</p>
                </TableCell>
                <TableCell>{p.department}</TableCell>
                <TableCell>{p.doctorName}</TableCell>
                <TableCell className="text-muted-foreground">{p.lastVisit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
