import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  CalendarHeart,
  ReceiptIndianRupee,
  QrCode,
  Copy,
  Check,
  Lock,
  ExternalLink,
} from "lucide-react";
import { AppointmentStatus } from "./AppointmentStatus";
import {
  listPublicDoctorsFn,
  createPublicAppointmentFn,
  getHospitalSettingsFn,
} from "@/lib/api";
import gsap from "gsap";

interface AppointmentModalProps {
  children: React.ReactNode;
}

export function AppointmentModal({ children }: AppointmentModalProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [appointmentType, setAppointmentType] = useState<"normal" | "emergency">("normal");
  const [activeTab, setActiveTab] = useState<"book" | "status" | "pay">("book");
  const [copied, setCopied] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Selection & form states
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [bookedDetails, setBookedDetails] = useState<{
    name: string;
    phone: string;
    date: string;
    doctorName: string;
    fee: number;
    apptId: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch active doctors list from backend
  const { data: publicDoctors = [] } = useQuery({
    queryKey: ["public-doctors"],
    queryFn: () => listPublicDoctorsFn(),
  });

  // Fetch Admin-configured hospital settings (fees & UPI ID)
  const { data: settings } = useQuery({
    queryKey: ["hospital-settings"],
    queryFn: () => getHospitalSettingsFn(),
  });

  const normalFee = settings?.normalFee ?? 500;
  const emergencyFee = settings?.emergencyFee ?? 1000;
  const upiId = settings?.upiId || "pulseheartcentre@upi";
  const upiName = settings?.upiName || "Pulse Heart Centre";

  const currentFee = appointmentType === "emergency" ? emergencyFee : normalFee;

  const departments = Array.from(new Set(publicDoctors.map((d) => d.department)));
  const filteredDoctors = publicDoctors.filter(
    (d) => !selectedDept || d.department === selectedDept
  );

  useEffect(() => {
    if (publicDoctors.length > 0) {
      if (!selectedDept && departments.length > 0) {
        setSelectedDept(departments[0]);
      }
      if (!selectedDoctorId && publicDoctors.length > 0) {
        setSelectedDoctorId(publicDoctors[0].id);
      }
    }
  }, [publicDoctors, selectedDept, selectedDoctorId, departments]);

  const handleDepartmentChange = (dept: string) => {
    setSelectedDept(dept);
    const firstDoc = publicDoctors.find((d) => !dept || d.department === dept);
    if (firstDoc) {
      setSelectedDoctorId(firstDoc.id);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const email = (formData.get("email") as string) || "";
    const ageStr = (formData.get("age") as string) || "30";
    const gender = ((formData.get("gender") as string) || "Male") as "Male" | "Female" | "Other";
    const age = parseInt(ageStr, 10) || 30;
    const date = (formData.get("date") as string) || new Date().toISOString().slice(0, 10);
    const address = (formData.get("address") as string) || "";
    const state = (formData.get("state") as string) || "";
    const country = (formData.get("country") as string) || "";

    const doctor = publicDoctors.find((d) => d.id === selectedDoctorId);

    try {
      const res = await createPublicAppointmentFn({
        data: {
          patientName: name,
          phone,
          email,
          age,
          gender,
          department: selectedDept || doctor?.department || "General Medicine",
          doctorId: selectedDoctorId || doctor?.id || "",
          date,
          time: appointmentType === "emergency" ? "Immediate Emergency" : "10:00 AM",
          address,
          state,
          country,
        },
      });

      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["all-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
      toast.success("Appointment request submitted successfully!");

      const cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone) {
        const existing = JSON.parse(localStorage.getItem("pulse_bookings") || "{}");
        existing[cleanPhone] = {
          status: "pending",
          timestamp: Date.now(),
          doctorName: doctor?.name,
        };
        localStorage.setItem("pulse_bookings", JSON.stringify(existing));
      }

      setBookedDetails({
        name,
        phone,
        date,
        doctorName: doctor?.name || "Doctor",
        fee: currentFee,
        apptId: res.appointmentId,
      });

      // Switch to Payment Gateway view
      setActiveTab("pay");
    } catch (err: any) {
      console.error("Booking error:", err);
      alert(err.message || "Failed to book appointment.");
    }
  };

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
    upiName
  )}&am=${currentFee}&cu=INR&tn=${encodeURIComponent(
    `Pulse Heart Centre Consultation Fee - ${bookedDetails?.name || "Appointment"}`
  )}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiUrl
  )}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[550px] w-[calc(100%-2rem)] p-0 max-h-[88vh] !flex flex-col overflow-hidden border-border bg-card shadow-luxe rounded-3xl">
        <div className="p-5 pb-6 sm:p-6 flex-1 overflow-y-auto min-h-0" ref={containerRef}>
          <DialogHeader className="mb-4 text-left">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[oklch(0.42_0.18_265)] to-[oklch(0.62_0.15_210)] shadow-glow text-white">
                <CalendarHeart className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg font-bold">
                  {activeTab === "pay" ? "Complete Payment" : "Book Appointment"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-[11px] mt-0.5">
                  {activeTab === "pay"
                    ? "Scan QR code or tap to pay exact preset fee via UPI."
                    : "Select department, doctor, and confirm your schedule."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {activeTab !== "pay" && (
            <div className="mb-4 flex overflow-hidden rounded-full border border-border bg-muted/50 p-1">
              <button
                onClick={() => setActiveTab("book")}
                className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "book"
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Book Appointment
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-all ${
                  activeTab === "status"
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Check Status
              </button>
            </div>
          )}

          {activeTab === "book" && (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-3 grid-cols-2">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Full Name
                  </label>
                  <input
                    name="name"
                    required
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring transition-colors"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Mobile Number
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring transition-colors"
                  />
                </div>

                <div className="col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Age (Years)
                  </label>
                  <input
                    name="age"
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="e.g. 30"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring transition-colors"
                  />
                </div>

                <div className="col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Gender
                  </label>
                  <select
                    name="gender"
                    required
                    defaultValue="Male"
                    className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Email
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring transition-colors"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Department
                  </label>
                  <select
                    value={selectedDept}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring transition-colors"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Doctor
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring transition-colors font-medium text-primary"
                  >
                    {filteredDoctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} ({doc.specialty})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Date
                  </label>
                  <input
                    name="date"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring transition-colors"
                  />
                </div>

                <div className="col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Type
                  </label>
                  <select
                    name="type"
                    required
                    value={appointmentType}
                    onChange={(e) => setAppointmentType(e.target.value as "normal" | "emergency")}
                    className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring transition-colors"
                  >
                    <option value="normal">Normal (₹{normalFee})</option>
                    <option value="emergency">Emergency (₹{emergencyFee})</option>
                  </select>
                </div>

                
                <div className="col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    State
                  </label>
                  <select
                    name="state"
                    required
                    defaultValue="Uttar Pradesh"
                    className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring transition-colors"
                  >
                    <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                    <option value="Assam">Assam</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chandigarh">Chandigarh</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Dadra and Nagar Haveli">Dadra and Nagar Haveli</option>
                    <option value="Daman and Diu">Daman and Diu</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Goa">Goa</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Haryana">Haryana</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Jharkhand">Jharkhand</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Ladakh">Ladakh</option>
                    <option value="Lakshadweep">Lakshadweep</option>
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Manipur">Manipur</option>
                    <option value="Meghalaya">Meghalaya</option>
                    <option value="Mizoram">Mizoram</option>
                    <option value="Nagaland">Nagaland</option>
                    <option value="Odisha">Odisha</option>
                    <option value="Puducherry">Puducherry</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Sikkim">Sikkim</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tripura">Tripura</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="West Bengal">West Bengal</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Country
                  </label>
                  <select
                    name="country"
                    required
                    defaultValue="India"
                    className="w-full rounded-xl border border-input bg-background px-2.5 py-2 text-sm outline-none focus:border-ring transition-colors"
                  >
                    <option value="India">India</option>
                    <option value="Nepal">Nepal</option>
                    <option value="Bangladesh">Bangladesh</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
<div className="col-span-2">
                  <label className="mb-1 block text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Address
                  </label>
                  <textarea
                    name="address"
                    required
                    rows={2}
                    placeholder="Full Address..."
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Fee Summary */}
              <div className="mt-4 rounded-2xl bg-muted/40 p-2.5 px-3 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-background rounded-full p-1.5 text-primary shadow-sm">
                    <ReceiptIndianRupee className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Consultation Fee</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">
                      {appointmentType === "emergency"
                        ? "Priority Emergency Assessment"
                        : "Standard OPD Assessment"}
                    </div>
                  </div>
                </div>
                <div className="text-lg font-display font-bold text-primary">₹{currentFee}</div>
              </div>

              <button
                type="submit"
                className="btn-lux mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[oklch(0.42_0.18_265)] to-[oklch(0.62_0.15_210)] px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Proceed to Pay ₹{currentFee}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {activeTab === "status" && (
            <div>
              <AppointmentStatus />
            </div>
          )}

          {activeTab === "pay" && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 w-full text-left space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Appointment Booking Request</div>
                <div className="text-base font-bold text-foreground">{bookedDetails?.name}</div>
                <div className="text-xs text-muted-foreground">
                  Doctor: <span className="font-semibold text-foreground">{bookedDetails?.doctorName}</span> · Date: {bookedDetails?.date}
                </div>
              </div>

              {/* Exact Locked Fee Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-5 py-2 text-emerald-600 dark:text-emerald-400">
                <Lock className="h-4 w-4" />
                <span className="text-xs font-semibold">Locked Preset Fee:</span>
                <span className="text-xl font-bold font-display">₹{currentFee}</span>
              </div>

              {/* UPI QR Code */}
              <div className="p-3 bg-white rounded-2xl border border-border shadow-md inline-block">
                <img
                  src={qrImageUrl}
                  alt="UPI Payment QR Code"
                  className="w-44 h-44 object-contain"
                />
              </div>

              <div className="text-xs text-muted-foreground">
                Scan QR code with GPay, PhonePe, Paytm, or BHIM. Amount is automatically preset to ₹{currentFee}.
              </div>

              {/* UPI ID Copy Box */}
              <div className="flex items-center justify-between rounded-xl border bg-background px-3 py-2 w-full text-xs">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-primary" />
                  <span className="font-mono font-semibold">{upiId}</span>
                  <span className="text-[10px] text-muted-foreground">({upiName})</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="flex items-center gap-1 text-primary hover:underline font-semibold"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              {/* Direct UPI App Launch Link */}
              <a
                href={upiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 w-full hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <ExternalLink className="h-4 w-4" /> Open UPI App (GPay / PhonePe / Paytm)
              </a>

              <button
                type="button"
                onClick={() => {
                  setBookingSuccess(true);
                  setTimeout(() => {
                    setOpen(false);
                    setActiveTab("book");
                    setBookingSuccess(false);
                  }, 1500);
                }}
                className="w-full rounded-full border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                {bookingSuccess ? "Payment Marked Complete ✓" : "I Have Completed Payment"}
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
