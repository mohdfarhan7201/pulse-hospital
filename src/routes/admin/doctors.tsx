import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Eye, EyeOff, Pencil, Plus, Search, Trash2, User } from "lucide-react";
import { useRef, useState } from "react";

import { createDoctorFn, deleteDoctorFn, listDoctorsFn, updateDoctorFn } from "@/lib/api";
import { toast } from "sonner";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/doctors")({
  component: DoctorsPage,
});

const initials = (name: string) =>
  name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const EMPTY_FORM = {
  name: "",
  specialty: "",
  department: "",
  email: "",
  phone: "",
  experienceYears: "",
  status: "Active" as "Active" | "On Leave",
  photoUrl: "" as string,
  bio: "",
  password: "",
};

type DoctorForm = typeof EMPTY_FORM;

/** Converts a File to a base64 data-URL */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PhotoPicker({
  value,
  onChange,
  name,
}: {
  value: string;
  onChange: (url: string) => void;
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await fileToDataUrl(file);
    onChange(url);
    // reset so same file can be re-picked
    e.target.value = "";
  };

  return (
    <div className="col-span-2 flex items-center gap-4">
      <div
        className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-primary"
        onClick={() => inputRef.current?.click()}
        title="Click to upload photo"
      >
        {value ? (
          <img src={value} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <User className="h-6 w-6" />
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-center bg-black/0 transition-colors hover:bg-black/30">
          <span className="mb-1.5 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity hover:opacity-100">
            <Camera className="h-3 w-3" /> Upload
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Camera className="h-3.5 w-3.5" />
          {value ? "Change photo" : "Upload photo"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => onChange("")}
          >
            Remove
          </Button>
        )}
        <p className="text-[11px] text-muted-foreground">JPG, PNG, WEBP · shown on hospital website</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

function DoctorFormFields({
  form,
  setForm,
  showStatus,
}: {
  form: DoctorForm;
  setForm: (f: DoctorForm) => void;
  showStatus?: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Photo upload */}
      <PhotoPicker
        value={form.photoUrl}
        onChange={(url) => setForm({ ...form, photoUrl: url })}
        name={form.name || "Doctor"}
      />

      <div className="col-span-2 space-y-1.5">
        <Label>Full name</Label>
        <Input
          required
          placeholder="Dr. Jane Doe"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Specialty</Label>
        <Input
          required
          placeholder="Cardiologist"
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Department</Label>
        <Input
          required
          placeholder="Cardiology"
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input
          required
          type="email"
          placeholder="jane.doe@pulseheart.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Phone</Label>
        <Input
          required
          placeholder="+91 90000 00000"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Experience (years)</Label>
        <Input
          required
          type="number"
          min={0}
          value={form.experienceYears}
          onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Login Password</Label>
        <div className="relative">
          <Input
            required={!showStatus}
            type={showPassword ? "text" : "password"}
            placeholder="Set password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            title={showPassword ? "Hide Password" : "Show Password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {showStatus && (
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm({ ...form, status: v as "Active" | "On Leave" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      {/* Bio — full width */}
      <div className="col-span-2 space-y-1.5">
        <Label>
          Bio{" "}
          <span className="text-xs font-normal text-muted-foreground">(shown on hospital website)</span>
        </Label>
        <Textarea
          placeholder="Short description about the doctor's expertise, qualifications and experience…"
          rows={3}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
        />
      </div>
    </div>
  );
}

function DoctorsPage() {
  const queryClient = useQueryClient();

  // ── Add dialog ──
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<DoctorForm>({ ...EMPTY_FORM });

  // ── Edit dialog ──
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<DoctorForm & { id: string }>({
    id: "",
    ...EMPTY_FORM,
  });

  // ── Search ──
  const [search, setSearch] = useState("");

  const { data: doctors, isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["doctors"],
    queryFn: () => listDoctorsFn(),
  });

  const filtered = (doctors ?? []).filter((doc) => {
    const q = search.toLowerCase();
    return (
      !q ||
      doc.name.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q) ||
      doc.department.toLowerCase().includes(q) ||
      doc.email.toLowerCase().includes(q)
    );
  });

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: () =>
      createDoctorFn({
        data: {
          name: addForm.name,
          specialty: addForm.specialty,
          department: addForm.department,
          email: addForm.email,
          phone: addForm.phone,
          experienceYears: Number(addForm.experienceYears) || 0,
          photoUrl: addForm.photoUrl || undefined,
          bio: addForm.bio || undefined,
          password: addForm.password,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["public-doctors"] });
      toast.success("Doctor added successfully! Login credentials created.");
      setAddOpen(false);
      setAddForm({ ...EMPTY_FORM });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add doctor");
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateDoctorFn({
        data: {
          id: editForm.id,
          name: editForm.name,
          specialty: editForm.specialty,
          department: editForm.department,
          email: editForm.email,
          phone: editForm.phone,
          experienceYears: Number(editForm.experienceYears) || 0,
          status: editForm.status,
          photoUrl: editForm.photoUrl || undefined,
          bio: editForm.bio || undefined,
          password: editForm.password || undefined,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["public-doctors"] });
      toast.success("Doctor details updated successfully!");
      setEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update doctor");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDoctorFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      queryClient.invalidateQueries({ queryKey: ["public-doctors"] });
      toast.success("Doctor deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete doctor");
    },
  });

  const openEdit = (doc: NonNullable<typeof doctors>[number]) => {
    setEditForm({
      id: doc.id,
      name: doc.name,
      specialty: doc.specialty,
      department: doc.department,
      email: doc.email,
      phone: doc.phone,
      experienceYears: String(doc.experienceYears),
      status: doc.status,
      photoUrl: doc.photoUrl ?? "",
      bio: doc.bio ?? "",
      password: "",
    });
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Doctors</h2>
          <p className="text-sm text-muted-foreground">Manage every doctor on your hospital roster.</p>
        </div>

        {/* Add dialog */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add new doctor</DialogTitle>
              <DialogDescription>This creates a doctor record and publishes them on the hospital website.</DialogDescription>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <DoctorFormFields form={addForm} setForm={setAddForm} />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending} className="w-full">
                  {createMutation.isPending ? "Adding…" : "Add Doctor"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog (controlled, no trigger) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit doctor</DialogTitle>
            <DialogDescription>Update the doctor's information, photo and status.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
          >
            <DoctorFormFields
              form={editForm}
              setForm={(f) => setEditForm({ ...f, id: editForm.id })}
              showStatus
            />
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="p-5">
        {/* Search bar */}
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            id="doctor-search"
            placeholder="Search by name, specialty, department or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Doctor</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Patients</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading doctors…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  {search ? `No doctors found for "${search}"` : "No doctors added yet."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      {doc.photoUrl && <AvatarImage src={doc.photoUrl} alt={doc.name} className="object-cover" />}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {initials(doc.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{doc.department}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <p>{doc.email}</p>
                  <p>{doc.phone}</p>
                </TableCell>
                <TableCell>{doc.experienceYears}+ yrs</TableCell>
                <TableCell>{doc.patientCount}</TableCell>
                <TableCell>
                  <StatusBadge status={doc.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(doc)}
                      aria-label={`Edit ${doc.name}`}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      aria-label={`Remove ${doc.name}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
