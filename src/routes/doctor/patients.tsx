import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { listMyPatientsFn } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
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
  const { data: patients, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["my-patients"],
    queryFn: () => listMyPatientsFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Patients</h2>
        <p className="text-sm text-muted-foreground">Patients currently under your care.</p>
      </div>

      <Card className="p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Last Visit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Loading patients…
                </TableCell>
              </TableRow>
            )}
            {patients?.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
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
                <TableCell className="text-muted-foreground">{p.lastVisit}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
