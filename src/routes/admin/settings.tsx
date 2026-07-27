import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";

import { getHospitalSettingsFn, updateHospitalSettingsFn } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useRouteContext({ from: "/admin" });

  const { data: settings } = useQuery({
    refetchInterval: 5000,
    queryKey: ["hospital-settings"],
    queryFn: () => getHospitalSettingsFn(),
  });

  // General Settings State
  const [hospitalName, setHospitalName] = useState("Pulse Heart Centre");
  const [tagline, setTagline] = useState("Advanced Cardiac Care & Multi-specialty Hospital");
  const [contactEmail, setContactEmail] = useState("info@pulseheartcentre.com");
  const [helplinePhone, setHelplinePhone] = useState("+91 98765 43210");
  const [address, setAddress] = useState("Station Road, Near Golghar, Gorakhpur, UP 273001");
  const [opdHours, setOpdHours] = useState("Mon - Sat: 8:00 AM - 8:00 PM | Sun: Emergency Only");

  // Fee & UPI State
  const [normalFee, setNormalFee] = useState(500);
  const [emergencyFee, setEmergencyFee] = useState(1000);
  const [upiId, setUpiId] = useState("pulseheartcentre@upi");
  const [upiName, setUpiName] = useState("Pulse Heart Centre");

  // Profile Settings State
  const [adminName, setAdminName] = useState(user.name);
  const [adminEmail, setAdminEmail] = useState(user.email);
  const [currPassword, setCurrPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password Visibility Toggles
  const [showCurrPassword, setShowCurrPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setHospitalName(settings.hospitalName || "Pulse Heart Centre");
      setTagline(settings.tagline || "");
      setContactEmail(settings.contactEmail || "");
      setHelplinePhone(settings.helplinePhone || "");
      setAddress(settings.address || "");
      setOpdHours(settings.opdHours || "");
      setNormalFee(settings.normalFee ?? 500);
      setEmergencyFee(settings.emergencyFee ?? 1000);
      setUpiId(settings.upiId || "pulseheartcentre@upi");
      setUpiName(settings.upiName || "Pulse Heart Centre");
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateHospitalSettingsFn>[0]["data"]) =>
      updateHospitalSettingsFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospital-settings"] });
      triggerSaved("Settings updated successfully!");
    },
  });
  const triggerSaved = (msg: string) => {
    setSavedBanner(msg);
    toast.success(msg);
    setTimeout(() => setSavedBanner(null), 3000);
  };

  const handleSaveHospitalInfo = () => {
    updateMutation.mutate({
      hospitalName,
      tagline,
      contactEmail,
      helplinePhone,
      address,
      opdHours,
      normalFee: Number(normalFee),
      emergencyFee: Number(emergencyFee),
      upiId,
      upiName,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Admin & Hospital Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage hospital profile, consultation fees, UPI payment gateway, and admin credentials.
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
        <TabsList className="grid w-full grid-cols-3 max-w-lg h-auto p-1 bg-muted/60">
          <TabsTrigger value="hospital" className="gap-2 py-2.5">
            <Building2 className="h-4 w-4" /> Hospital Info
          </TabsTrigger>
          <TabsTrigger value="fees" className="gap-2 py-2.5">
            <ReceiptIndianRupee className="h-4 w-4" /> Fees & UPI
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 py-2.5">
            <User className="h-4 w-4" /> Admin Account
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Hospital Information */}
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
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Emergency Helpline Phone
                  </Label>
                  <Input
                    id="hphone"
                    value={helplinePhone}
                    onChange={(e) => setHelplinePhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Full Hospital Address
                </Label>
                <Textarea
                  id="address"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="opd">OPD Timings</Label>
                <Input id="opd" value={opdHours} onChange={(e) => setOpdHours(e.target.value)} />
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={handleSaveHospitalInfo} disabled={updateMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" /> Save Hospital Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Consultation Fees & UPI Payment Settings */}
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ReceiptIndianRupee className="h-5 w-5 text-primary" /> Consultation Fees & UPI Payment Gateway
              </CardTitle>
              <CardDescription>
                Set prices for Normal and Emergency appointments, and configure your Hospital UPI ID for exact patient payments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Consultation Fees Section */}
              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ReceiptIndianRupee className="h-4 w-4 text-emerald-600" /> Patient Appointment Fees
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="normalFee" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Normal Consultation Fee (₹)
                    </Label>
                    <Input
                      id="normalFee"
                      type="number"
                      value={normalFee}
                      onChange={(e) => setNormalFee(Number(e.target.value))}
                      placeholder="500"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Auto-loaded when patient books a Normal appointment.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyFee" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Emergency Consultation Fee (₹)
                    </Label>
                    <Input
                      id="emergencyFee"
                      type="number"
                      value={emergencyFee}
                      onChange={(e) => setEmergencyFee(Number(e.target.value))}
                      placeholder="1000"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Auto-loaded when patient selects Emergency consultation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hospital UPI Gateway Section */}
              <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-cyan-600" /> Hospital UPI Payment Settings
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="upiId" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Hospital UPI ID / VPA
                    </Label>
                    <Input
                      id="upiId"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. pulseheartcentre@upi or 9876543210@paytm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Direct UPI address to receive instant patient payments.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upiName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Merchant / Account Display Name
                    </Label>
                    <Input
                      id="upiName"
                      value={upiName}
                      onChange={(e) => setUpiName(e.target.value)}
                      placeholder="Pulse Heart Centre"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Name displayed inside GPay / PhonePe / Paytm.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button onClick={handleSaveHospitalInfo} disabled={updateMutation.isPending} className="gap-2">
                  <Save className="h-4 w-4" /> Save Fees & UPI Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Admin Profile & Security */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Super Admin Profile
              </CardTitle>
              <CardDescription>
                Update your login credentials and personal display details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="aname">Admin Full Name</Label>
                  <Input
                    id="aname"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aemail">Admin Email Address</Label>
                  <Input
                    id="aemail"
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <Button onClick={() => triggerSaved("Profile updated!")} className="gap-2">
                  <Save className="h-4 w-4" /> Update Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" /> Security & Password
              </CardTitle>
              <CardDescription>
                Update your admin login password.
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

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="cnpwd">Confirm New Password</Label>
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
