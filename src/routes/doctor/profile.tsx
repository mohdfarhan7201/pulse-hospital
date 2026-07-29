import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Building2, Mail, Phone, Users } from "lucide-react";

import { getMyProfileFn } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export const Route = createFileRoute("/doctor/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: doctor, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["my-profile"],
    queryFn: () => getMyProfileFn(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground">Your professional details at Pulse Heart Centre.</p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Loading profile…</p>}

      {doctor && (
        <Card className="max-w-2xl p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border">
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {doctor.name
                  .replace(/^Dr\.?\s*/i, "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">{doctor.name}</h3>
              <p className="text-sm text-muted-foreground">{doctor.specialty}</p>
            </div>
            <span className="ml-auto">
              <StatusBadge status={doctor.status} />
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{doctor.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Experience</p>
                <p className="text-sm font-medium">{doctor.experienceYears}+ Years</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{doctor.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{doctor.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Specialization</p>
                <p className="text-sm font-medium">{doctor.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3 sm:col-span-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Degree & Qualification</p>
                <p className="text-sm font-medium">{doctor.bio || "Not specified"}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
