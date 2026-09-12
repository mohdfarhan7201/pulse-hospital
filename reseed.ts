import { connectToDatabase, UserModel, DoctorModel, PatientModel, AppointmentModel, InvoiceModel, NotificationModel, SessionModel, SettingsModel, BlogModel } from "./src/lib/server/mongodb.js";
import { randomBytes, scryptSync } from "crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function reseed() {
  console.log("Connecting to MongoDB...");
  await connectToDatabase();
  console.log("Connected.");

  console.log("Clearing old collections...");
  await UserModel.deleteMany({});
  await DoctorModel.deleteMany({});
  // Keeping patients, appointments, etc. might be desired, but let's clear them since it's a demo or reset.
  // Or just clear users and doctors to replace them with the new single doctor.
  
  const doctor = {
    id: "doc-prakash",
    name: "Dr. Prakash Chand Shahi",
    specialty: "Cardiologist",
    department: "Cardiology",
    email: "doctor@pulseheart.com",
    phone: "+91 98765 10001",
    experienceYears: 15,
    status: "Active",
    joinedOn: "2010-01-01",
  };

  const user = {
    id: "user-doc-prakash",
    name: "Dr. Prakash Chand Shahi",
    email: "doctor@pulseheart.com",
    passwordHash: hashPassword("Doctor@123"),
    role: "doctor",
    doctorId: "doc-prakash",
    avatarInitials: "PC",
  };

  await DoctorModel.create(doctor);
  await UserModel.create(user);

  console.log("Successfully seeded new single doctor: doctor@pulseheart.com / Doctor@123");
  process.exit(0);
}

reseed().catch(console.error);
