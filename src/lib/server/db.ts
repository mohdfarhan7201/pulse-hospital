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

export type Role = "doctor";

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
  tokenNo?: string;
  status: AppointmentStatus;
  address: string;
  state: string;
  country: string;
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

export interface BlogRecord {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  authorId: string;
}

export interface HospitalSettingsRecord {
  hospitalName: string;
  tagline: string;
  contactEmail: string;
  helplinePhone: string;
  secondaryPhone?: string;
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
  blogs: BlogRecord[];
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
      id: "doc-prakash",
      name: "Dr. Prakash Chand Shahi",
      specialty: "Cardiologist",
      department: "Cardiology",
      email: "doctor@pulseheart.com",
      phone: "+91 98765 10001",
      experienceYears: 15,
      status: "Active",
      joinedOn: "2010-01-01",
    },
  ];

  const patients: PatientRecord[] = [];
  const appointments: AppointmentRecord[] = [];
  const invoices: InvoiceRecord[] = [];
  const notifications: NotificationRecord[] = [];
  const blogs: BlogRecord[] = [];

  const users: UserRecord[] = [
    {
      id: "user-doc-prakash",
      name: "Dr. Prakash Chand Shahi",
      email: "doctor@pulseheart.com",
      passwordHash: hashPassword("Doctor@123"),
      role: "doctor",
      doctorId: "doc-prakash",
      avatarInitials: "PC",
    },
  ];

  return { users, doctors, patients, appointments, invoices, notifications, sessions: {}, blogs };
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
  BlogModel,
} from "./mongodb";

let isMongoConnecting = false;
let isMongoConnected = false;
let lastMongoSync = 0;

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
    lastMongoSync = Date.now();
  } catch (err: any) {
    console.error(`[MongoDB] Connection failed: ${err.message || err}`);
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
      ...cache.blogs.map((b) => BlogModel.updateOne({ id: b.id }, b, { upsert: true })),
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
    const [users, doctors, patients, appointments, invoices, notifications, sessionsDocs, settingsDocs, blogs] = await Promise.all([
      UserModel.find({}).lean(),
      DoctorModel.find({}).lean(),
      PatientModel.find({}).lean(),
      AppointmentModel.find({}).lean(),
      InvoiceModel.find({}).lean(),
      NotificationModel.find({}).lean(),
      SessionModel.find({}).lean(),
      SettingsModel.find({}).lean(),
      BlogModel.find({}).lean(),
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
        tokenNo: a.tokenNo,
        status: a.status,
        address: a.address,
        state: a.state,
        country: a.country,
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
      blogs: blogs.map((b: any) => ({
        id: b.id,
        title: b.title,
        content: b.content,
        imageUrl: b.imageUrl,
        videoUrl: b.videoUrl,
        createdAt: b.createdAt,
        authorId: b.authorId,
      })),
      sessions,
      settings: settingsDocs.length > 0 ? {
        hospitalName: settingsDocs[0].hospitalName,
        tagline: settingsDocs[0].tagline,
        contactEmail: settingsDocs[0].contactEmail,
        helplinePhone: settingsDocs[0].helplinePhone,
        secondaryPhone: settingsDocs[0].secondaryPhone,
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

async function load(): Promise<DbShape> {
  if (!isMongoConnected && !isMongoConnecting) {
    try {
      await syncMongoDb();
    } catch {}
  } else if (isMongoConnected && Date.now() - lastMongoSync > 2000) {
    try {
      await loadCacheFromMongo();
      lastMongoSync = Date.now();
    } catch {}
  }
  if (cache) return cache;
  try {
    if (existsSync(DB_PATH)) {
      const raw = readFileSync(DB_PATH, "utf-8");
      cache = JSON.parse(raw) as DbShape;
      return cache;
    }
  } catch {
    // fall through if read error
  }
  
  // If we have a mongo URI but failed to connect, returning hardcoded seedDb() 
  // will wipe out the user's view in production. Only seed if we actually intend to use local file.
  if (process.env.MONGODB_URI) {
    console.warn("[MongoDB] Returning empty fallback cache instead of hardcoded seed, as MongoDB is configured.");
    return { users: [], doctors: [], patients: [], appointments: [], invoices: [], notifications: [], sessions: {}, blogs: [] };
  }

  cache = seedDb();
  await persist();
  return cache;
}

async function persist() {
  if (!cache) return;
  try {
    const dir = dirname(DB_PATH);
    try { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); } catch(e) {}
    writeFileSync(DB_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch {
    // In edge/serverless runtimes without a writable filesystem, we silently
    // keep working off the in-memory cache for the life of the process.
  }
  if (isMongoConnected) {
    try {
      await saveCacheToMongo();
    } catch {}
  }
}

export async function getDb(): Promise<DbShape> {
  const db = await load();
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

export async function saveDb() {
  await persist();
}

export function newId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

