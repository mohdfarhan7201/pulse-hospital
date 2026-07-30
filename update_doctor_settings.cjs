const fs = require('fs');
const filePath = 'src/routes/doctor/settings.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Import updateDoctorProfileFn and query hooks
code = code.replace(
  'import { createFileRoute, useRouteContext } from "@tanstack/react-router";',
  'import { createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";\nimport { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";\nimport { updateDoctorProfileFn, getMyProfileFn } from "@/lib/api";'
);

// 2. Wrap state initialization with useQuery and use effect to populate
code = code.replace(
  'const { user } = useRouteContext({ from: "/doctor" });',
  `const { user } = useRouteContext({ from: "/doctor" });
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["doctor-profile"], queryFn: () => getMyProfileFn() });
`
);

// 3. Update the handleSave functions
code = code.replace(
  '  const triggerSaved = (msg: string) => {',
  `
  const updateMutation = useMutation({
    mutationFn: (vars: Parameters<typeof updateDoctorProfileFn>[0]["data"]) => updateDoctorProfileFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-profile"] });
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

  const triggerSaved = (msg: string) => {`
);

// 4. Populate state from profile
code = code.replace(
  'const [docName, setDocName] = useState(user.name);',
  `const [docName, setDocName] = useState(user.name);
  import { useEffect } from "react";
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
  `
);

// 5. Replace onClick in UI
code = code.replace(
  'onClick={() => triggerSaved("Profile details saved!")}',
  'onClick={handleSaveProfile} disabled={updateMutation.isPending}'
);

code = code.replace(
  'onClick={() => triggerSaved("Password updated securely!")}',
  'onClick={handleSavePassword} disabled={updateMutation.isPending}'
);

fs.writeFileSync(filePath, code);
console.log('doctor/settings.tsx updated!');
