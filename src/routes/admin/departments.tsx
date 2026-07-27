import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";

import { listDepartmentsFn } from "@/lib/api";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/departments")({
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const { data: departments, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["departments"],
    queryFn: () => listDepartmentsFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Departments</h2>
        <p className="text-sm text-muted-foreground">
          Departments are derived automatically from your doctor roster.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading departments…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {departments?.map((d) => (
          <Card key={d.name} className="p-5">
            <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-600">
              <Building2 className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{d.name}</h3>
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                <span className="font-semibold text-foreground">{d.doctorCount}</span> Doctors
              </span>
              <span>
                <span className="font-semibold text-foreground">{d.patientCount}</span> Patients
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
