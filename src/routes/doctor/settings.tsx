import { createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateDoctorProfileFn, getMyProfileFn } from "@/lib/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  Phone,
  ReceiptIndianRupee,
  Save,
  User,
  QrCode,
  Upload,
  Trash2,
  Camera,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getHospitalSettingsFn, updateHospitalSettingsFn } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/doctor/settings")({
  component: DoctorSettingsPage,
});

function DoctorSettingsPage() {
  const { user } = useRouteContext({ from: "/doctor" });
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["doctor-profile"], queryFn: () => getMyProfileFn() });
  const { data: settings } = useQuery({ queryKey: ["hospital-settings"], queryFn: () => getHospitalSettingsFn() });


  // Doctor Profile State
  const [docName, setDocName] = useState(user.name);

  const [docEmail, setDocEmail] = useState(user.email);
  const [docPhone, setDocPhone] = useState("+91 98765 43210");
  const [specialty, setSpecialty] = useState("Interventional Cardiology");
  const [department, setDepartment] = useState("Diagnostics");
  const [experience, setExperience] = useState("12");
  const [qualification, setQualification] = useState("MD, DM (Cardiology), FACC");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  // General Settings State
  const [hospitalName, setHospitalName] = useState("Pulse Heart Centre");
  const [tagline, setTagline] = useState("Advanced Cardiac Care & Multi-specialty Hospital");
  const [contactEmail, setContactEmail] = useState("info@pulseheartcentre.com");
  const [helplinePhone, setHelplinePhone] = useState("+91 98765 43210");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [address, setAddress] = useState("Station Road, Near Golghar, Gorakhpur, UP 273001");
  const [opdHours, setOpdHours] = useState("Mon - Sat: 8:00 AM - 8:00 PM | Sun: Emergency Only");

  // Fee & UPI State
  const [normalFee, setNormalFee] = useState(500);
  const [emergencyFee, setEmergencyFee] = useState(1000);
  const [upiId, setUpiId] = useState("pulseheartcentre@upi");
  const [upiName, setUpiName] = useState("Pulse Heart Centre");

  useEffect(() => {
    if (profile) {
      setDocName(profile.name || "");
      setDocEmail(profile.email || "");
      setDocPhone(profile.phone || "");
      setExperience(String(profile.experienceYears || ""));
      setDepartment(profile.department || "");
      setSpecialty(profile.specialty || "");
      setQualification(profile.bio || "");
      if (profile.photoUrl) setPhotoUrl(profile.photoUrl);
    }

    if (settings) {
      setHospitalName(settings.hospitalName || "Pulse Heart Centre");
      setTagline(settings.tagline || "");
      setContactEmail(settings.contactEmail || "");
      setHelplinePhone(settings.helplinePhone || "");
      setSecondaryPhone(settings.secondaryPhone || "");
      setAddress(settings.address || "");
      setOpdHours(settings.opdHours || "");
      setNormalFee(settings.normalFee ?? 500);
      setEmergencyFee(settings.emergencyFee ?? 1000);
      setUpiId(settings.upiId || "pulseheartcentre@upi");
      setUpiName(settings.upiName || "Pulse Heart Centre");
    }
  }, [profile, settings]);

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
      queryClient.invalidateQueries({ queryKey: ["public-doctors"] });
      router.invalidate();
    }
  });

  const updateHospitalMutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateHospitalSettingsFn>[0]["data"]) =>
      updateHospitalSettingsFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital-settings"] });
      triggerSaved("Hospital settings updated successfully!");
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, JPEG, WEBP)");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image file size should be less than 8MB");
      return;
    }

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
          setPhotoUrl(resizedDataUrl);
          toast.success("Photo selected! Click 'Save Profile Details' to apply.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      await updateMutation.mutateAsync({
        name: docName,
        email: docEmail,
        phone: docPhone,
        experienceYears: Number(experience),
        department,
        specialty,
        qualification,
        photoUrl,
      });
      triggerSaved("Profile details saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    }
  };

  const handleSaveHospitalInfo = () => {
    updateHospitalMutation.mutate({
      hospitalName,
      tagline,
      contactEmail,
      helplinePhone,
      secondaryPhone,
      address,
      opdHours,
      normalFee: Number(normalFee),
      emergencyFee: Number(emergencyFee),
      upiId,
      upiName,
    });
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

      <Tabs defaultValue="hospital" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl h-auto p-1 bg-muted/60">
          <TabsTrigger value="hospital" className="gap-2 py-2.5">
            <Building2 className="h-4 w-4" /> Hospital Info
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-2 py-2.5">
            <ReceiptIndianRupee className="h-4 w-4" /> Fees & UPI
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 py-2.5">
            <User className="h-4 w-4" /> Profile Info
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 py-2.5">
            <Lock className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hospital">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Hospital Profile & Contact
              </CardTitle>
              <CardDescription>
                Publicly displayed information on patient receipts, portal, and hospital header.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hname">Hospital Name</Label>
                  <Input
                    id="hname"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline / Motto</Label>
                  <Input
                    id="tagline"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cemail" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Contact Email
                  </Label>
                  <Input
                    id="cemail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hphone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Primary Helpline
                  </Label>
                  <Input
                    id="hphone"
                    value={helplinePhone}
                    onChange={(e) => setHelplinePhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sphone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Secondary Phone
                  </Label>
                  <Input
                    id="sphone"
                    value={secondaryPhone}
                    onChange={(e) => setSecondaryPhone(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opd" className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" /> OPD Timings
                  </Label>
                  <Input
                    id="opd"
                    value={opdHours}
                    onChange={(e) => setOpdHours(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <Button onClick={handleSaveHospitalInfo} className="w-full sm:w-auto" disabled={updateHospitalMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateHospitalMutation.isPending ? "Saving..." : "Save Hospital Details"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Fees & UPI */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ReceiptIndianRupee className="h-5 w-5 text-primary" /> Consultation Fees
              </CardTitle>
              <CardDescription>
                Default fees charged for regular and emergency appointments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 border-b pb-6">
              <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="nfee">Normal Fee (₹)</Label>
                  <Input
                    id="nfee"
                    type="number"
                    value={normalFee}
                    onChange={(e) => setNormalFee(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="efee">Emergency Fee (₹)</Label>
                  <Input
                    id="efee"
                    type="number"
                    value={emergencyFee}
                    onChange={(e) => setEmergencyFee(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>

            <CardHeader className="pt-6">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" /> UPI Payment Gateway
              </CardTitle>
              <CardDescription>
                UPI details displayed to patients for online payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="upiId">Hospital UPI ID</Label>
                  <Input
                    id="upiId"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. hospital@upi"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upiName">Merchant Name (UPI)</Label>
                  <Input
                    id="upiName"
                    value={upiName}
                    onChange={(e) => setUpiName(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSaveHospitalInfo} className="w-full sm:w-auto mt-4" disabled={updateHospitalMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateHospitalMutation.isPending ? "Saving..." : "Save Financial Details"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

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
              {/* Profile Photo Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border bg-muted/20">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md">
                    {photoUrl && <AvatarImage src={photoUrl} alt={docName} className="object-cover" />}
                    <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                      {docName
                        .replace(/^Dr\.?\s*/i, "")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "DR"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <div>
                    <h4 className="text-sm font-semibold">Doctor Profile Photo</h4>
                    <p className="text-xs text-muted-foreground">
                      This photo will appear on your portal header, doctor profile page, and the public hospital website.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <input
                      type="file"
                      id="doctor-photo-input"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("doctor-photo-input")?.click()}
                      className="gap-1.5 text-xs"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {photoUrl ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {photoUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPhotoUrl("")}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove Photo
                      </Button>
                    )}
                  </div>
                </div>
              </div>

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
                    list="dept-options"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Cardiology, Diagnostics"
                  />
                  <datalist id="dept-options">
                    <option value="Diagnostics" />
                  </datalist>
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
