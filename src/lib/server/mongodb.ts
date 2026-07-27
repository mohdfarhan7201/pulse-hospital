import mongoose from "mongoose";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/pulse_db";

/**
 * Global cache for MongoDB connection to prevent multiple connections in dev mode (HMR)
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log(`[MongoDB] Connected successfully to ${MONGODB_URI}`);
      return mongooseInstance;
    }).catch((err) => {
      console.warn(`[MongoDB] Could not connect to ${MONGODB_URI}:`, err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export function getMongoDbUri(): string {
  return MONGODB_URI;
}

// ---------------------------------------------------------------------------
// Mongoose Schemas & Models
// ---------------------------------------------------------------------------

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ["admin", "doctor"] },
  doctorId: { type: String },
  avatarInitials: { type: String, required: true },
}, { timestamps: true });

const DoctorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  department: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  experienceYears: { type: Number, required: true },
  status: { type: String, required: true, enum: ["Active", "On Leave"] },
  joinedOn: { type: String, required: true },
  photoUrl: { type: String },
  bio: { type: String },
}, { timestamps: true });

const PatientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  primaryDoctorId: { type: String, required: true },
  lastVisit: { type: String, required: true },
  createdAt: { type: String, required: true },
}, { timestamps: true });

const AppointmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  department: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: { type: String, required: true },
  reason: { type: String, required: true },
  createdAt: { type: String, required: true },
}, { timestamps: true });

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  appointmentId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, required: true, enum: ["Paid", "Pending"] },
  date: { type: String, required: true },
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  audience: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: String, required: true },
  read: { type: Boolean, required: true, default: false },
}, { timestamps: true });

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  createdAt: { type: String, required: true },
  expiresAt: { type: String, required: true },
}, { timestamps: true });

const SettingsSchema = new mongoose.Schema({
  id: { type: String, required: true, default: "hospital_settings", unique: true },
  hospitalName: { type: String },
  tagline: { type: String },
  contactEmail: { type: String },
  helplinePhone: { type: String },
  address: { type: String },
  opdHours: { type: String },
  normalFee: { type: Number },
  emergencyFee: { type: Number },
  upiId: { type: String },
  upiName: { type: String },
}, { timestamps: true });

export const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);
export const DoctorModel = mongoose.models.Doctor || mongoose.model("Doctor", DoctorSchema);
export const PatientModel = mongoose.models.Patient || mongoose.model("Patient", PatientSchema);
export const AppointmentModel = mongoose.models.Appointment || mongoose.model("Appointment", AppointmentSchema);
export const InvoiceModel = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
export const SessionModel = mongoose.models.Session || mongoose.model("Session", SessionSchema);
export const SettingsModel = mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
