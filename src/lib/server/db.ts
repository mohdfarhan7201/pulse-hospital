// Lightweight file-based "backend" database for Pulse Heart Centre.
//
// This project ships with TanStack Start's server functions as its API layer
// (see auth.ts / api.ts). Instead of requiring an external database server,
// all data lives in a single JSON file on disk (data/pulse-db.json) that is
// read/written with Node's fs module and cached in memory for the life of the
// process. This is intentionally simple so the whole app runs with nothing
// more than `npm install && npm run dev` — no Postgres/Mongo/Docker required —
// while still being a real, persistent, server-side data store that every
// dashboard reads and writes through.
//
// Swap this module out for Postgres/Prisma/Drizzle/etc. later without
// touching any route or component code — every consumer only imports the
// typed helpers exported from here and from auth.ts / api.ts.

import { randomUUID, scryptSync, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Role = "admin" | "doctor";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // "salt:hash"
  role: Role;
  doctorId?: string; // set when role === "doctor"
  avatarInitials: string;
}

export interface DoctorRecord {
  id: string;
  name: string;
  specialty: string;
  department: string;
  email: string;
  phone: string;
  experienceYears: number;
  status: "Active" | "On Leave";
  joinedOn: string;
  photoUrl?: string; // base64 data-URL of the doctor's profile photo
  bio?: string;      // short biography shown on the public website
}

export interface PatientRecord {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  department: string;
  primaryDoctorId: string;
  lastVisit: string;
  createdAt: string;
}

export type AppointmentStatus =
  | "Confirmed"
  | "Pending"
  | "In Consultation"
  | "Waiting"
  | "Completed"
  | "Cancelled";

export interface AppointmentRecord {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  doctorId: string;
  doctorName: string;
  department: string;
  date: string; // yyyy-mm-dd
  time: string; // e.g. "10:00 AM"
  status: AppointmentStatus;
  reason: string;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId: string;
  amount: number;
  status: "Paid" | "Pending";
  date: string;
}

export interface NotificationRecord {
  id: string;
  audience: string; // "admin" or a doctorId
  message: string;
  createdAt: string;
  read: boolean;
}

export interface SessionRecord {
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface HospitalSettingsRecord {
  hospitalName: string;
  tagline: string;
  contactEmail: string;
  helplinePhone: string;
  address: string;
  opdHours: string;
  normalFee: number;
  emergencyFee: number;
  upiId: string;
  upiName: string;
}

export interface DbShape {
  users: UserRecord[];
  doctors: DoctorRecord[];
  patients: PatientRecord[];
  appointments: AppointmentRecord[];
  invoices: InvoiceRecord[];
  notifications: NotificationRecord[];
  sessions: Record<string, SessionRecord>;
  settings?: HospitalSettingsRecord;
}

// ---------------------------------------------------------------------------
// Password hashing (scrypt, no external deps)
// ---------------------------------------------------------------------------

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64).toString("hex");
  if (candidate.length !== hash.length) return false;
  // constant-time-ish compare
  let diff = 0;
  for (let i = 0; i < candidate.length; i++) {
    diff |= candidate.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const DB_PATH = join(process.cwd(), "data", "pulse-db.json");

let cache: DbShape | null = null;

function seedDb(): DbShape {
  const now = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return iso(d);
  };
  const daysFromNow = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return iso(d);
  };

  const doctors: DoctorRecord[] = [
    {
      id: "doc-amit-verma",
      name: "Dr. Amit Verma",
      specialty: "Cardiologist",
      department: "Cardiology",
      email: "amit.verma@pulseheart.com",
      phone: "+91 98765 10001",
      experienceYears: 10,
      status: "Active",
      joinedOn: "2016-03-01",
    },
    {
      id: "doc-neha-gupta",
      name: "Dr. Neha Gupta",
      specialty: "Neurologist",
      department: "Neurology",
      email: "neha.gupta@pulseheart.com",
      phone: "+91 98765 10002",
      experienceYears: 8,
      status: "Active",
      joinedOn: "2018-06-15",
    },
    {
      id: "doc-rohit-kumar",
      name: "Dr. Rohit Kumar",
      specialty: "Orthopedic Surgeon",
      department: "Orthopedics",
      email: "rohit.kumar@pulseheart.com",
      phone: "+91 98765 10003",
      experienceYears: 12,
      status: "Active",
      joinedOn: "2014-01-10",
    },
    {
      id: "doc-pooja-sharma",
      name: "Dr. Pooja Sharma",
      specialty: "Pediatrician",
      department: "Pediatrics",
      email: "pooja.sharma@pulseheart.com",
      phone: "+91 98765 10004",
      experienceYears: 6,
      status: "Active",
      joinedOn: "2020-09-01",
    },
    {
      id: "doc-arjun-mehta",
      name: "Dr. Arjun Mehta",
      specialty: "Cardiologist",
      department: "Cardiology",
      email: "arjun.mehta@pulseheart.com",
      phone: "+91 98765 10005",
      experienceYears: 9,
      status: "Active",
      joinedOn: "2017-11-20",
    },
    {
      id: "doc-kavita-rao",
      name: "Dr. Kavita Rao",
      specialty: "General Physician",
      department: "General Medicine",
      email: "kavita.rao@pulseheart.com",
      phone: "+91 98765 10006",
      experienceYears: 5,
      status: "On Leave",
      joinedOn: "2021-02-14",
    },
  ];

  const patients: PatientRecord[] = [
    {
      id: "pat-rahul-sharma",
      name: "Rahul Sharma",
      age: 30,
      gender: "Male",
      phone: "+91 90000 00001",
      email: "rahul.sharma@example.com",
      department: "Cardiology",
      primaryDoctorId: "doc-amit-verma",
      lastVisit: daysAgo(2),
      createdAt: daysAgo(120),
    },
    {
      id: "pat-priya-singh",
      name: "Priya Singh",
      age: 28,
      gender: "Female",
      phone: "+91 90000 00002",
      email: "priya.singh@example.com",
      department: "Neurology",
      primaryDoctorId: "doc-neha-gupta",
      lastVisit: daysAgo(1),
      createdAt: daysAgo(90),
    },
    {
      id: "pat-vikram-patel",
      name: "Vikram Patel",
      age: 45,
      gender: "Male",
      phone: "+91 90000 00003",
      email: "vikram.patel@example.com",
      department: "Orthopedics",
      primaryDoctorId: "doc-rohit-kumar",
      lastVisit: daysAgo(5),
      createdAt: daysAgo(200),
    },
    {
      id: "pat-anjali-mehta",
      name: "Anjali Mehta",
      age: 32,
      gender: "Female",
      phone: "+91 90000 00004",
      email: "anjali.mehta@example.com",
      department: "Pediatrics",
      primaryDoctorId: "doc-pooja-sharma",
      lastVisit: daysAgo(3),
      createdAt: daysAgo(60),
    },
    {
      id: "pat-suresh-yadav",
      name: "Suresh Yadav",
      age: 50,
      gender: "Male",
      phone: "+91 90000 00005",
      email: "suresh.yadav@example.com",
      department: "Cardiology",
      primaryDoctorId: "doc-amit-verma",
      lastVisit: daysAgo(10),
      createdAt: daysAgo(400),
    },
  ];

  const appointments: AppointmentRecord[] = [
    {
      id: "apt-1",
      patientId: "pat-rahul-sharma",
      patientName: "Rahul Sharma",
      age: 30,
      gender: "Male",
      doctorId: "doc-amit-verma",
      doctorName: "Dr. Amit Verma",
      department: "Cardiology",
      date: iso(now),
      time: "10:00 AM",
      status: "Confirmed",
      reason: "Routine cardiac check-up",
      createdAt: daysAgo(3),
    },
    {
      id: "apt-2",
      patientId: "pat-priya-singh",
      patientName: "Priya Singh",
      age: 28,
      gender: "Female",
      doctorId: "doc-neha-gupta",
      doctorName: "Dr. Neha Gupta",
      department: "Neurology",
      date: iso(now),
      time: "10:30 AM",
      status: "Confirmed",
      reason: "Migraine follow-up",
      createdAt: daysAgo(2),
    },
    {
      id: "apt-3",
      patientId: "pat-vikram-patel",
      patientName: "Vikram Patel",
      age: 45,
      gender: "Male",
      doctorId: "doc-amit-verma",
      doctorName: "Dr. Amit Verma",
      department: "Cardiology",
      date: iso(now),
      time: "11:00 AM",
      status: "In Consultation",
      reason: "Chest pain evaluation",
      createdAt: daysAgo(1),
    },
    {
      id: "apt-4",
      patientId: "pat-anjali-mehta",
      patientName: "Anjali Mehta",
      age: 32,
      gender: "Female",
      doctorId: "doc-amit-verma",
      doctorName: "Dr. Amit Verma",
      department: "Cardiology",
      date: iso(now),
      time: "11:30 AM",
      status: "Waiting",
      reason: "ECG review",
      createdAt: daysAgo(1),
    },
    {
      id: "apt-5",
      patientId: "pat-suresh-yadav",
      patientName: "Suresh Yadav",
      age: 50,
      gender: "Male",
      doctorId: "doc-amit-verma",
      doctorName: "Dr. Amit Verma",
      department: "Cardiology",
      date: iso(now),
      time: "12:00 PM",
      status: "Pending",
      reason: "Post-surgery review",
      createdAt: daysAgo(1),
    },
    {
      id: "apt-6",
      patientId: "pat-rahul-sharma",
      patientName: "Rahul Sharma",
      age: 30,
      gender: "Male",
      doctorId: "doc-rohit-kumar",
      doctorName: "Dr. Rohit Kumar",
      department: "Orthopedics",
      date: daysAgo(1),
      time: "01:00 PM",
      status: "Completed",
      reason: "Knee pain",
      createdAt: daysAgo(6),
    },
    {
      id: "apt-7",
      patientId: "pat-vikram-patel",
      patientName: "Vikram Patel",
      age: 45,
      gender: "Male",
      doctorId: "doc-pooja-sharma",
      doctorName: "Dr. Pooja Sharma",
      department: "Pediatrics",
      date: daysAgo(1),
      time: "02:30 PM",
      status: "Confirmed",
      reason: "Consultation",
      createdAt: daysAgo(4),
    },
    {
      id: "apt-8",
      patientId: "pat-suresh-yadav",
      patientName: "Suresh Yadav",
      age: 50,
      gender: "Male",
      doctorId: "doc-amit-verma",
      doctorName: "Dr. Amit Verma",
      department: "Cardiology",
      date: daysAgo(1),
      time: "04:00 PM",
      status: "Cancelled",
      reason: "Follow-up",
      createdAt: daysAgo(5),
    },
    {
      id: "apt-9",
      patientId: "pat-priya-singh",
      patientName: "Priya Singh",
      age: 28,
      gender: "Female",
      doctorId: "doc-amit-verma",
      doctorName: "Dr. Amit Verma",
      department: "Cardiology",
      date: daysFromNow(1),
      time: "09:30 AM",
      status: "Confirmed",
      reason: "New patient consult",
      createdAt: daysAgo(1),
    },
  ];

  const invoices: InvoiceRecord[] = appointments
    .filter((a) => a.status === "Completed" || a.status === "Confirmed")
    .map((a, i) => ({
      id: `inv-${i + 1}`,
      patientId: a.patientId,
      patientName: a.patientName,
      appointmentId: a.id,
      amount: 1000 + (i % 4) * 500,
      status: i % 3 === 0 ? "Pending" : "Paid",
      date: a.date,
    }));

  const notifications: NotificationRecord[] = [
    {
      id: "note-1",
      audience: "admin",
      message: "Dr. Kavita Rao requested leave for next week.",
      createdAt: daysAgo(1),
      read: false,
    },
    {
      id: "note-2",
      audience: "admin",
      message: "New patient registration: Anjali Mehta.",
      createdAt: daysAgo(2),
      read: false,
    },
    {
      id: "note-3",
      audience: "doc-amit-verma",
      message: "Suresh Yadav rescheduled his follow-up.",
      createdAt: daysAgo(1),
      read: false,
    },
    {
      id: "note-4",
      audience: "doc-amit-verma",
      message: "Lab results are ready for Vikram Patel.",
      createdAt: daysAgo(1),
      read: false,
    },
    {
      id: "note-5",
      audience: "doc-amit-verma",
      message: "You have 5 patients waiting today.",
      createdAt: iso(now),
      read: false,
    },
  ];

  const users: UserRecord[] = [
    {
      id: "user-admin",
      name: "Super Admin",
      email: "admin@pulseheart.com",
      passwordHash: hashPassword("Admin@123"),
      role: "admin",
      avatarInitials: "SA",
    },
    {
      id: "user-doc-amit-verma",
      name: "Dr. Amit Verma",
      email: "amit.verma@pulseheart.com",
      passwordHash: hashPassword("Doctor@123"),
      role: "doctor",
      doctorId: "doc-amit-verma",
      avatarInitials: "AV",
    },
    {
      id: "user-doc-neha-gupta",
      name: "Dr. Neha Gupta",
      email: "neha.gupta@pulseheart.com",
      passwordHash: hashPassword("Doctor@123"),
      role: "doctor",
      doctorId: "doc-neha-gupta",
      avatarInitials: "NG",
    },
    {
      id: "user-doc-rohit-kumar",
      name: "Dr. Rohit Kumar",
      email: "rohit.kumar@pulseheart.com",
      passwordHash: hashPassword("Doctor@123"),
      role: "doctor",
      doctorId: "doc-rohit-kumar",
      avatarInitials: "RK",
    },
    {
      id: "user-doc-pooja-sharma",
      name: "Dr. Pooja Sharma",
      email: "pooja.sharma@pulseheart.com",
      passwordHash: hashPassword("Doctor@123"),
      role: "doctor",
      doctorId: "doc-pooja-sharma",
      avatarInitials: "PS",
    },
    {
      id: "user-doc-arjun-mehta",
      name: "Dr. Arjun Mehta",
      email: "arjun.mehta@pulseheart.com",
      passwordHash: hashPassword("Doctor@123"),
      role: "doctor",
      doctorId: "doc-arjun-mehta",
      avatarInitials: "AM",
    },
    {
      id: "user-doc-kavita-rao",
      name: "Dr. Kavita Rao",
      email: "kavita.rao@pulseheart.com",
      passwordHash: hashPassword("Doctor@123"),
      role: "doctor",
      doctorId: "doc-kavita-rao",
      avatarInitials: "KR",
    },
  ];

  return { users, doctors, patients, appointments, invoices, notifications, sessions: {} };
}

import {
  connectToDatabase,
  UserModel,
  DoctorModel,
  PatientModel,
  AppointmentModel,
  InvoiceModel,
  NotificationModel,
  SessionModel,
  SettingsModel,
} from "./mongodb";

let isMongoConnecting = false;
let isMongoConnected = false;

export async function syncMongoDb() {
  if (isMongoConnecting || isMongoConnected) return;
  isMongoConnecting = true;
  try {
    await connectToDatabase();
    isMongoConnected = true;

    const userCount = await UserModel.countDocuments();
    if (userCount === 0 && cache) {
      await saveCacheToMongo();
    } else if (userCount > 0) {
      await loadCacheFromMongo();
    }
  } catch (err: any) {
    console.log(`[MongoDB] Connection notice (localhost:27017): ${err.message || err}`);
  } finally {
    isMongoConnecting = false;
  }
}

async function saveCacheToMongo() {
  if (!cache || !isMongoConnected) return;
  try {
    const promises: Promise<any>[] = [
      ...cache.users.map((u) => UserModel.updateOne({ id: u.id }, u, { upsert: true })),
      ...cache.doctors.map((d) => DoctorModel.updateOne({ id: d.id }, d, { upsert: true })),
      ...cache.patients.map((p) => PatientModel.updateOne({ id: p.id }, p, { upsert: true })),
      ...cache.appointments.map((a) => AppointmentModel.updateOne({ id: a.id }, a, { upsert: true })),
      ...cache.invoices.map((i) => InvoiceModel.updateOne({ id: i.id }, i, { upsert: true })),
      ...cache.notifications.map((n) => NotificationModel.updateOne({ id: n.id }, n, { upsert: true })),
      ...Object.entries(cache.sessions).map(([sessionId, s]) =>
        SessionModel.updateOne({ sessionId }, { sessionId, ...s }, { upsert: true })
      ),
    ];

    if (cache.settings) {
      promises.push(
        SettingsModel.updateOne(
          { id: "hospital_settings" },
          { id: "hospital_settings", ...cache.settings },
          { upsert: true }
        )
      );
    }

    await Promise.all(promises);
  } catch (err: any) {
    console.warn("[MongoDB] Error saving data to MongoDB:", err.message);
  }
}

async function loadCacheFromMongo() {
  try {
    const [users, doctors, patients, appointments, invoices, notifications, sessionsDocs, settingsDocs] = await Promise.all([
      UserModel.find({}).lean(),
      DoctorModel.find({}).lean(),
      PatientModel.find({}).lean(),
      AppointmentModel.find({}).lean(),
      InvoiceModel.find({}).lean(),
      NotificationModel.find({}).lean(),
      SessionModel.find({}).lean(),
      SettingsModel.find({}).lean(),
    ]);

    const sessions: Record<string, SessionRecord> = {};
    sessionsDocs.forEach((doc: any) => {
      sessions[doc.sessionId] = {
        userId: doc.userId,
        createdAt: doc.createdAt,
        expiresAt: doc.expiresAt,
      };
    });

    cache = {
      users: users.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.passwordHash,
        role: u.role,
        doctorId: u.doctorId,
        avatarInitials: u.avatarInitials,
      })),
      doctors: doctors.map((d: any) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        department: d.department,
        email: d.email,
        phone: d.phone,
        experienceYears: d.experienceYears,
        status: d.status,
        joinedOn: d.joinedOn,
        photoUrl: d.photoUrl,
        bio: d.bio,
      })),
      patients: patients.map((p: any) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        gender: p.gender,
        phone: p.phone,
        email: p.email,
        department: p.department,
        primaryDoctorId: p.primaryDoctorId,
        lastVisit: p.lastVisit,
        createdAt: p.createdAt,
      })),
      appointments: appointments.map((a: any) => ({
        id: a.id,
        patientId: a.patientId,
        patientName: a.patientName,
        age: a.age,
        gender: a.gender,
        doctorId: a.doctorId,
        doctorName: a.doctorName,
        department: a.department,
        date: a.date,
        time: a.time,
        status: a.status,
        reason: a.reason,
        createdAt: a.createdAt,
      })),
      invoices: invoices.map((i: any) => ({
        id: i.id,
        patientId: i.patientId,
        patientName: i.patientName,
        appointmentId: i.appointmentId,
        amount: i.amount,
        status: i.status,
        date: i.date,
      })),
      notifications: notifications.map((n: any) => ({
        id: n.id,
        audience: n.audience,
        message: n.message,
        createdAt: n.createdAt,
        read: n.read,
      })),
      sessions,
      settings: settingsDocs.length > 0 ? {
        hospitalName: settingsDocs[0].hospitalName,
        tagline: settingsDocs[0].tagline,
        contactEmail: settingsDocs[0].contactEmail,
        helplinePhone: settingsDocs[0].helplinePhone,
        address: settingsDocs[0].address,
        opdHours: settingsDocs[0].opdHours,
        normalFee: settingsDocs[0].normalFee,
        emergencyFee: settingsDocs[0].emergencyFee,
        upiId: settingsDocs[0].upiId,
        upiName: settingsDocs[0].upiName,
      } : undefined,
    };
  } catch (err: any) {
    console.warn("[MongoDB] Error loading data from MongoDB:", err.message);
  }
}

function load(): DbShape {
  if (!isMongoConnected && !isMongoConnecting) {
    syncMongoDb().catch(() => {});
  }
  try {
    if (existsSync(DB_PATH)) {
      const raw = readFileSync(DB_PATH, "utf-8");
      cache = JSON.parse(raw) as DbShape;
      return cache;
    }
  } catch {
    // fall through if read error
  }
  if (cache) return cache;
  cache = seedDb();
  persist();
  return cache;
}

function persist() {
  if (!cache) return;
  try {
    const dir = dirname(DB_PATH);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(DB_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // In edge/serverless runtimes without a writable filesystem, we silently
    // keep working off the in-memory cache for the life of the process.
  }
  if (isMongoConnected) {
    saveCacheToMongo().catch(() => {});
  }
}

export function getDb(): DbShape {
  const db = load();
  if (!db.settings) {
    db.settings = {
      hospitalName: "Pulse Heart Centre",
      tagline: "Advanced Cardiac Care & Multi-specialty Hospital",
      contactEmail: "info@pulseheartcentre.com",
      helplinePhone: "+91 98765 43210",
      address: "Station Road, Near Golghar, Gorakhpur, UP 273001",
      opdHours: "Mon - Sat: 8:00 AM - 8:00 PM | Sun: Emergency Only",
      normalFee: 500,
      emergencyFee: 1000,
      upiId: "pulseheartcentre@upi",
      upiName: "Pulse Heart Centre",
    };
  }
  return db;
}

export function saveDb() {
  persist();
}

export function newId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

