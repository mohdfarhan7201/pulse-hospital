const fs = require('fs');
const apiPath = 'src/lib/api.ts';
let code = fs.readFileSync(apiPath, 'utf8');

const updateFnCode = `
export const updateDoctorProfileFn = createServerFn({ method: "POST" })
  .validator((data: { name?: string; email?: string; phone?: string; experienceYears?: number; department?: string; specialty?: string; qualification?: string; password?: string; newPassword?: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireDoctor();
    const db = await getDb();
    const doctor = db.doctors.find((d) => d.id === user.doctorId);
    if (!doctor) throw new Error("Doctor not found");
    const userRec = db.users.find((u) => u.id === user.id);
    if (!userRec) throw new Error("User not found");

    if (data.newPassword && data.password) {
      const { verifyPassword } = await import("./server/db");
      if (!verifyPassword(data.password, userRec.passwordHash)) {
        throw new Error("Invalid current password");
      }
      userRec.passwordHash = hashPassword(data.newPassword);
    }

    if (data.name) { doctor.name = data.name; userRec.name = data.name; }
    if (data.email) { doctor.email = data.email; userRec.email = data.email; }
    if (data.phone) doctor.phone = data.phone;
    if (data.experienceYears !== undefined) doctor.experienceYears = data.experienceYears;
    if (data.department) doctor.department = data.department;
    if (data.specialty) doctor.specialty = data.specialty;
    if (data.qualification) doctor.bio = data.qualification;

    await saveDb();
    return { success: true };
  });
`;

if (!code.includes("updateDoctorProfileFn")) {
  code += "\n" + updateFnCode;
  fs.writeFileSync(apiPath, code);
  console.log("updateDoctorProfileFn added");
}
