import { createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateDoctorProfileFn, getMyProfileFn } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Save,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/doctor/settings")({
  component: DoctorSettingsPage,
});

function DoctorSettingsPage() {
  const { user } = useRouteContext({ from: "/doctor" });
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["doctor-profile"], queryFn: () => getMyProfileFn() });


  // Doctor Profile State
  const [docName, setDocName] = useState(user.name);

  const [docEmail, setDocEmail] = useState(user.email);
  const [docPhone, setDocPhone] = useState("+91 98765 43210");
  const [specialty, setSpecialty] = useState("Interventional Cardiology");
  const [department, setDepartment] = useState("Cardiology");
  const [experience, setExperience] = useState("12");
  const [qualification, setQualification] = useState("MD, DM (Cardiology), FACC");

  useEffect(() => {
    if (profile) {
      setDocName(profile.name || "");
      setDocEmail(profile.email || "");
      setDocPhone(profile.phone || "");
      setExperience(String(profile.experienceYears || ""));
      setDepartment(profile.department || "");
      setSpecialty(profile.specialty || "");
      setQualification(profile.bio || "");
    }
  }, [profile]);

  // Security & Password State
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password Visibility Toggles
  const [showCurrPassword, setShowCurrPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savedBanner, setSavedBanner] = useState<string | null>(null);


  const updateMutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateDoctorProfileFn>[0]["data"]) => updateDoctorProfileFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      router.invalidate();
    }
  });

  const handleSaveProfile = async () => {
    try {
      await updateMutation.mutateAsync({
        name: docName,
        email: docEmail,
        phone: docPhone,
        experienceYears: Number(experience),
        department,
        specialty,
        qualification
      });
      triggerSaved("Profile details saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    }
  };

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match!");
    }
    if (!currPassword) {
      return toast.error("Current password is required.");
    }
    try {
      await updateMutation.mutateAsync({
        password: currPassword,
        newPassword: newPassword,
      });
      setCurrPassword("");
      setNewPassword("");
      setConfirmPassword("");
      triggerSaved("Password updated securely!");
    } catch (e: any) {
      toast.error(e.message || "Failed to update password");
    }
  };

  const triggerSaved = (msg: string) => {
    setSavedBanner(msg);
    toast.success(msg);
    setTimeout(() => setSavedBanner(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Doctor Settings & Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your professional details and portal login password.
          </p>
        </div>
        {savedBanner && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1.5 text-xs font-semibold text-emerald-600 animate-in fade-in duration-300">
            <CheckCircle2 className="h-4 w-4" />
            {savedBanner}
          </div>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md h-auto p-1 bg-muted/60">
          <TabsTrigger value="profile" className="gap-2 py-2.5">
            <User className="h-4 w-4" /> Profile Info
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 py-2.5">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile & Professional Information */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Personal & Professional Profile
              </CardTitle>
              <CardDescription>
                Public doctor details visible to patients during online appointment booking.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dname">Doctor Name</Label>
                  <Input
                    id="dname"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="demail" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                  </Label>
                  <Input
                    id="demail"
                    type="email"
                    value={docEmail}
                    onChange={(e) => setDocEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dphone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Contact Mobile
                  </Label>
                  <Input
                    id="dphone"
                    value={docPhone}
                    onChange={(e) => setDocPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <Input
                    id="experience"
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dept">Department</Label>
                  <Input
                    id="dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spec">Specialty</Label>
                  <Input
                    id="spec"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qual">Degrees & Qualifications</Label>
                <Input
                  id="qual"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. MBBS, MD, DM"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={handleSaveProfile} disabled={updateMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" /> Save Profile Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Security & Password Change */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Password & Login Security
              </CardTitle>
              <CardDescription>
                Update your doctor portal login password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="cpwd">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="cpwd"
                      type={showCurrPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={currPassword}
                      onChange={(e) => setCurrPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrPassword(!showCurrPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title={showCurrPassword ? "Hide Password" : "Show Password"}
                    >
                      {showCurrPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="npwd">New Password</Label>
                  <div className="relative">
                    <Input
                      id="npwd"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title={showNewPassword ? "Hide Password" : "Show Password"}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="cnpwd">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="cnpwd"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      title={showConfirmPassword ? "Hide Password" : "Show Password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => {
                    if (!currPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
                      toast.error("Please fill in all password fields (Current, New & Confirm).");
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      toast.error("New password and Confirm password do not match.");
                      return;
                    }
                    if (newPassword.length < 6) {
                      toast.error("New password must be at least 6 characters long.");
                      return;
                    }
                    setCurrPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    triggerSaved("Password changed successfully!");
                  }}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" /> Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
