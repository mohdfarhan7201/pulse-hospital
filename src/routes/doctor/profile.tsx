import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Briefcase, Building2, Mail, Phone, Users, Camera, Upload, Trash2, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { getMyProfileFn, updateDoctorProfileFn } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/StatusBadge";

export const Route = createFileRoute("/doctor/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: doctor, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["my-profile"],
    queryFn: () => getMyProfileFn(),
  });

  const updateProfileMutation = useMutation({
    mutationFn: (vars: { photoUrl?: string }) => updateDoctorProfileFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["public-doctors"] });
      router.invalidate();
      setIsUploading(false);
      toast.success("Profile photo updated successfully!");
    },
    onError: (err: any) => {
      setIsUploading(false);
      toast.error(err.message || "Failed to update profile photo");
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, JPEG, WEBP)");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file size should be less than 8MB");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
          updateProfileMutation.mutate({ photoUrl: resizedDataUrl });
        } else {
          setIsUploading(false);
        }
      };
      img.onerror = () => {
        setIsUploading(false);
        toast.error("Could not process image file");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected if needed
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    if (confirm("Are you sure you want to remove your profile photo?")) {
      setIsUploading(true);
      updateProfileMutation.mutate({ photoUrl: "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for direct photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Doctor Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your photo, credentials &amp; public representation at Pulse Heart Centre.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/30"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{isUploading ? "Uploading…" : "Upload Photo"}</span>
          </Button>

          <Link to="/doctor/settings">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
            >
              <span>Edit Full Profile</span>
            </Button>
          </Link>
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-8">Loading profile…</p>}

      {doctor && (
        <Card className="max-w-2xl p-6 shadow-sm border">
          {/* Header Card with Photo & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b">
            {/* Avatar with Camera Overlay (entire circle & badge clickable) */}
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="relative group self-center sm:self-auto cursor-pointer"
              title="Click to upload/change profile photo"
            >
              <Avatar className="h-24 w-24 border-2 border-emerald-500/30 shadow-md group-hover:border-emerald-500 group-hover:shadow-lg transition-all">
                {doctor.photoUrl && (
                  <AvatarImage src={doctor.photoUrl} alt={doctor.name} className="object-cover" />
                )}
                <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                  {doctor.name
                    .replace(/^Dr\.?\s*/i, "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera className="h-6 w-6 drop-shadow-md" />
              </div>

              {/* Camera badge at bottom-right */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-emerald-600 text-white shadow-md group-hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer z-10"
                title="Click to change profile photo"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-xl font-bold text-foreground">{doctor.name}</h3>
                <StatusBadge status={doctor.status} />
              </div>
              <p className="text-sm font-medium text-primary">{doctor.specialty}</p>
              <p className="text-xs text-muted-foreground">
                Photo will be displayed on the public landing page &amp; your doctor portal.
              </p>

              {/* Quick photo buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <Camera className="h-3 w-3" />
                  {doctor.photoUrl ? "Change Photo" : "Set Photo"}
                </button>
                {doctor.photoUrl && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={isUploading}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Professional Credentials Grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3.5 bg-muted/20">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Department</p>
                <p className="text-sm font-semibold text-foreground">{doctor.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3.5 bg-muted/20">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Clinical Experience</p>
                <p className="text-sm font-semibold text-foreground">{doctor.experienceYears}+ Years</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3.5 bg-muted/20">
              <Mail className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Email</p>
                <p className="text-sm font-semibold text-foreground">{doctor.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3.5 bg-muted/20">
              <Phone className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Phone</p>
                <p className="text-sm font-semibold text-foreground">{doctor.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3.5 bg-muted/20">
              <Briefcase className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Specialization</p>
                <p className="text-sm font-semibold text-foreground">{doctor.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3.5 bg-muted/20">
              <Users className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Active Patients</p>
                <p className="text-sm font-semibold text-foreground">{doctor.patientCount ?? 0} Patients</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg border p-3.5 bg-muted/20 sm:col-span-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Degrees &amp; Qualification</p>
                <p className="text-sm font-semibold text-foreground">
                  {doctor.bio || "MBBS, MD (Medicine), DM (Cardiology)"}
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
