import { createServerFn } from "@tanstack/react-start";

import { getDb, saveDb, newId, hashPassword, verifyPassword, type AppointmentStatus, type AppointmentRecord } from "./server/db";
import { getSessionFn } from "./auth";

export type { AppointmentStatus, AppointmentRecord };

function getAvatarInitials(name: string): string {
  return (
    name
      .replace(/^Dr\.?\s*/i, "")
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "DR"
  );
}

async function requireAdmin() {
  const { user } = await getSessionFn();
  if (!user || user.role !== "admin") throw new Error("UNAUTHENTICATED");
  return user;
}

async function requireDoctor() {
  const { user } = await getSessionFn();
  if (!user || user.role !== "doctor" || !user.doctorId) throw new Error("UNAUTHENTICATED");
  return user;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function lastNDaysLabelsAndDates(n: number) {
  const out: { label: string; date: string }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const label = WEEKDAY_LABELS[(d.getDay() + 6) % 7];
    out.push({ label, date: d.toISOString().slice(0, 10) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const getAdminOverviewFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const todaysAppointments = db.appointments.filter((a) => a.date === today);
  const revenueToday = db.invoices
    .filter((i) => i.date === today && i.status === "Paid")
    .reduce((sum, i) => sum + i.amount, 0);

  const week = lastNDaysLabelsAndDates(7).map(({ label, date }) => ({
    day: label,
    appointments: db.appointments.filter((a) => a.date === date).length,
  }));

  const byDeptCounts = new Map<string, number>();
  for (const a of db.appointments) {
    byDeptCounts.set(a.department, (byDeptCounts.get(a.department) ?? 0) + 1);
  }
  const totalDeptCount = [...byDeptCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const byDepartment = [...byDeptCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([department, count]) => ({
      department,
      percent: Math.round((count / totalDeptCount) * 100),
    }));

  const recentAppointments = [...db.appointments]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 6)
    .map((a) => ({
      id: a.id,
      patientName: a.patientName,
      doctorName: a.doctorName,
      department: a.department,
      date: a.date,
      time: a.time,
      status: a.status,
    }));

  return {
    totalDoctors: db.doctors.length,
    todaysAppointmentsCount: todaysAppointments.length,
    patientsTotal: db.patients.length,
    revenueToday,
    week,
    byDepartment,
    recentAppointments,
  };
});

export const listDoctorsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  return db.doctors.map((d) => ({
    ...d,
    patientCount: db.patients.filter((p) => p.primaryDoctorId === d.id).length,
  }));
});

/** Public — no auth required. Used by the landing page /#doctors section. */
export const listPublicDoctorsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  return db.doctors
    .filter((d) => d.status === "Active")
    .map((d) => ({
      id: d.id,
      name: d.name,
      specialty: d.specialty,
      department: d.department,
      phone: d.phone,
      experienceYears: d.experienceYears,
      photoUrl: d.photoUrl ?? null,
      bio: d.bio ?? null,
    }));
});

function parseTimeToMinutes(timeStr: string) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 10 * 60; // default 10:00 AM
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMins: number) {
  let hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")} ${ampm}`;
}

export const createPublicAppointmentFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      patientName: string;
      phone: string;
      email?: string;
      department: string;
      doctorId: string;
      date: string;
      time?: string;
      address: string;
      state: string;
      country: string;
      age?: number;
      gender?: "Male" | "Female" | "Other";
    }) => data,
  )
  .handler(async ({ data }) => {
    const db = await getDb();

    const doctor = db.doctors.find((d) => d.id === data.doctorId);
    const doctorName = doctor ? doctor.name : "Unassigned";

    const cleanPhone = data.phone.trim();
    let patient = db.patients.find(
      (p) => p.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, "")
    );

    if (!patient) {
      patient = {
        id: newId("pat"),
        name: data.patientName.trim(),
        age: data.age || 30,
        gender: data.gender || "Male",
        phone: cleanPhone,
        email: data.email?.trim() || "",
        department: data.department || doctor?.department || "General Medicine",
        primaryDoctorId: data.doctorId,
        lastVisit: data.date,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      db.patients.push(patient);
    } else {
      patient.lastVisit = data.date;
      if (data.doctorId) patient.primaryDoctorId = data.doctorId;
    }

    const apptId = newId("apt");
    const appointment: AppointmentRecord = {
      id: apptId,
      patientId: patient.id,
      patientName: data.patientName.trim(),
      age: patient.age,
      gender: patient.gender,
      doctorId: data.doctorId,
      doctorName,
      department: data.department || doctor?.department || "General Medicine",
      date: data.date,
      time: "",
      tokenNo: "",
      status: "Pending",
      address: data.address,
      state: data.state,
      country: data.country,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.appointments.push(appointment);

    const nowFormatted = new Date().toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Send notification to Admin
    db.notifications.push({
      id: newId("notif"),
      audience: "admin",
      message: `New appointment: ${appointment.patientName} booked with ${doctorName} (${appointment.department}) on ${appointment.date} at ${appointment.time}`,
      createdAt: nowFormatted,
      read: false,
    });

    // Send notification to Doctor
    if (doctor) {
      db.notifications.push({
        id: newId("notif"),
        audience: doctor.id,
        message: `New patient appointment: ${appointment.patientName} scheduled for ${appointment.date} at ${appointment.time}`,
        createdAt: nowFormatted,
        read: false,
      });
    }

    await saveDb();
    return { success: true, appointmentId: apptId, appointment };
  });

export const createDoctorFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      name: string;
      specialty: string;
      department: string;
      email: string;
      phone: string;
      experienceYears: number;
      photoUrl?: string;
      bio?: string;
      password: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();

    if (!data.password || !data.password.trim()) {
      throw new Error("Password is required to create a doctor login account.");
    }

    const emailClean = data.email.trim().toLowerCase();
    const existing = db.users.find((u) => u.email.toLowerCase() === emailClean);
    if (existing) {
      throw new Error(`A user account with email "${data.email}" already exists.`);
    }

    const doctorId = newId("doc");
    const doctor = {
      id: doctorId,
      name: data.name.trim(),
      specialty: data.specialty.trim(),
      department: data.department.trim(),
      email: emailClean,
      phone: data.phone.trim(),
      experienceYears: data.experienceYears,
      status: "Active" as const,
      joinedOn: new Date().toISOString().slice(0, 10),
      photoUrl: data.photoUrl,
      bio: data.bio,
    };
    db.doctors.push(doctor);

    const passwordHash = hashPassword(data.password.trim());

    db.users.push({
      id: newId("usr"),
      name: doctor.name,
      email: emailClean,
      passwordHash,
      role: "doctor",
      doctorId: doctorId,
      avatarInitials: getAvatarInitials(doctor.name),
    });

    await saveDb();
    return doctor;
  });

export const deleteDoctorFn = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    const doc = db.doctors.find((d) => d.id === data.id);
    const docEmail = doc?.email.toLowerCase();

    db.doctors = db.doctors.filter((d) => d.id !== data.id);
    db.users = db.users.filter(
      (u) => u.doctorId !== data.id && (!docEmail || u.email.toLowerCase() !== docEmail)
    );
    await saveDb();
    return { ok: true };
  });

export const updateDoctorFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      name: string;
      specialty: string;
      department: string;
      email: string;
      phone: string;
      experienceYears: number;
      status: "Active" | "On Leave";
      photoUrl?: string;
      bio?: string;
      password?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    const doc = db.doctors.find((d) => d.id === data.id);
    if (!doc) throw new Error("Doctor not found");

    const oldEmail = doc.email.toLowerCase();
    const newEmail = data.email.trim().toLowerCase();

    doc.name = data.name.trim();
    doc.specialty = data.specialty.trim();
    doc.department = data.department.trim();
    doc.email = newEmail;
    doc.phone = data.phone.trim();
    doc.experienceYears = data.experienceYears;
    doc.status = data.status;
    if (data.photoUrl !== undefined) doc.photoUrl = data.photoUrl;
    if (data.bio !== undefined) doc.bio = data.bio;

    const user = db.users.find((u) => u.doctorId === data.id || u.email.toLowerCase() === oldEmail);
    if (user) {
      user.name = doc.name;
      user.email = newEmail;
      user.avatarInitials = getAvatarInitials(doc.name);
      if (data.password && data.password.trim()) {
        user.passwordHash = hashPassword(data.password.trim());
      }
    } else {
      const rawPass = data.password && data.password.trim() ? data.password.trim() : "Doctor@123";
      db.users.push({
        id: newId("usr"),
        name: doc.name,
        email: newEmail,
        passwordHash: hashPassword(rawPass),
        role: "doctor",
        doctorId: doc.id,
        avatarInitials: getAvatarInitials(doc.name),
      });
    }

    await saveDb();
    return doc;
  });

export const listPatientsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  return db.patients.map((p) => ({
    ...p,
    doctorName: db.doctors.find((d) => d.id === p.primaryDoctorId)?.name ?? "Unassigned",
  }));
});

export const listDepartmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  const names = [...new Set(db.doctors.map((d) => d.department))];
  return names.map((name) => ({
    name,
    doctorCount: db.doctors.filter((d) => d.department === name).length,
    patientCount: db.patients.filter((p) => p.department === name).length,
  }));
});

export const listAllAppointmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  return [...db.appointments].sort((a, b) => (a.date < b.date ? 1 : -1));
});

export const updateAppointmentStatusFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: AppointmentStatus; time?: string; tokenNo?: string }) => data)
  .handler(async ({ data }) => {
    const db = await getDb();
    const appt = db.appointments.find((a) => a.id === data.id);
    if (!appt) throw new Error("Appointment not found");
    appt.status = data.status;
    if (data.time !== undefined) appt.time = data.time;
    if (data.tokenNo !== undefined) appt.tokenNo = data.tokenNo;
    await saveDb();
    return appt;
  });

export const getBillingFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  const invoices = [...db.invoices].sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalPaid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices
    .filter((i) => i.status === "Pending")
    .reduce((s, i) => s + i.amount, 0);
  return { invoices, totalPaid, totalPending };
});

export const getAdminReportsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  const statusCounts: Record<string, number> = {};
  for (const a of db.appointments) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }
  const doctorLoad = db.doctors
    .map((d) => ({
      name: d.name,
      department: d.department,
      appointments: db.appointments.filter((a) => a.doctorId === d.id).length,
      patients: db.patients.filter((p) => p.primaryDoctorId === d.id).length,
    }))
    .sort((a, b) => b.appointments - a.appointments);

  return {
    totalAppointments: db.appointments.length,
    totalPatients: db.patients.length,
    totalDoctors: db.doctors.length,
    statusCounts,
    doctorLoad,
  };
});

// ---------------------------------------------------------------------------
// Doctor
// ---------------------------------------------------------------------------

export const getDoctorOverviewFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireDoctor();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  const doctorId = user.doctorId!;

  const myAppointments = db.appointments.filter((a) => a.doctorId === doctorId);
  const todays = myAppointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));

  const upcoming = todays.filter((a) => a.status === "Confirmed" || a.status === "Pending");
  const completed = myAppointments.filter((a) => a.status === "Completed");
  const waiting = myAppointments.filter((a) => a.status === "Waiting");

  const week = lastNDaysLabelsAndDates(7).map(({ label, date }) => ({
    day: label,
    patients: new Set(
      myAppointments.filter((a) => a.date === date).map((a) => a.patientId),
    ).size,
  }));

  const myPatients = db.patients.filter((p) => p.primaryDoctorId === doctorId);
  const newPatients = myPatients.filter(
    (p) => new Date(p.createdAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 30,
  );

  const recentPatients = [...myPatients]
    .sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : -1))
    .slice(0, 4);

  return {
    todaysAppointmentsCount: todays.length,
    upcomingCount: upcoming.length,
    nextUpcomingTime: upcoming[0]?.time ?? null,
    completedCount: completed.length,
    waitingCount: waiting.length,
    todaysAppointments: todays,
    totalPatients: myPatients.length,
    newPatientsCount: newPatients.length,
    week,
    recentPatients,
  };
});

export const listMyAppointmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireDoctor();
  const db = await getDb();
  return [...db.appointments]
    .filter((a) => a.doctorId === user.doctorId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
});

export const lookupAppointmentStatusFn = createServerFn({ method: "POST" })
  .validator((query: string) => query)
  .handler(async ({ data: query }) => {
    const db = await getDb();
    const cleanQuery = query.trim().toLowerCase();
    const cleanDigits = query.replace(/\D/g, "");

    if (!cleanQuery && !cleanDigits) return [];

    // Find patients matching phone number
    const matchingPatientIds = new Set(
      db.patients
        .filter((p) => cleanDigits && p.phone.replace(/\D/g, "").includes(cleanDigits))
        .map((p) => p.id)
    );

    const matches = db.appointments.filter((a) => {
      const matchId = a.id.toLowerCase().includes(cleanQuery);
      const matchName = a.patientName.toLowerCase().includes(cleanQuery);
      const matchPatient = matchingPatientIds.has(a.patientId);
      return matchId || matchName || matchPatient;
    });

    // Sort by creation date descending
    const sorted = [...matches].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return sorted.map((a, idx) => {
      const sameDayDoctorAppts = db.appointments.filter(
        (x) => x.doctorId === a.doctorId && x.date === a.date
      );
      const tokenIndex = sameDayDoctorAppts.findIndex((x) => x.id === a.id);
      const tokenNo = tokenIndex >= 0 ? tokenIndex + 1 : idx + 1;
      const formattedToken = String(tokenNo).padStart(2, "0");
      const dateClean = a.date.replace(/-/g, "");

      return {
        ...a,
        tokenNo: formattedToken,
        displayId: `#PHC-${dateClean}-${formattedToken}`,
      };
    });
  });

export const listMyPatientsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireDoctor();
  const db = await getDb();
  return db.patients.filter((p) => p.primaryDoctorId === user.doctorId);
});

export const getMyScheduleFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireDoctor();
  const today = new Date();
  const days = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" }),
      hours: "09:00 AM - 05:00 PM",
    });
  }
  return { days };
});

export const getMyReportsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireDoctor();
  const db = await getDb();
  const mine = db.appointments.filter((a) => a.doctorId === user.doctorId);
  const statusCounts: Record<string, number> = {};
  for (const a of mine) statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  return {
    totalAppointments: mine.length,
    totalPatients: db.patients.filter((p) => p.primaryDoctorId === user.doctorId).length,
    statusCounts,
  };
});

export const listMyNotificationsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireDoctor();
  const db = await getDb();
  return db.notifications
    .filter((n) => n.audience === user.doctorId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
});

export const getMyProfileFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireDoctor();
  const db = await getDb();
  const doctor = db.doctors.find((d) => d.id === user.doctorId);
  if (!doctor) throw new Error("Doctor profile not found");
  return {
    ...doctor,
    email: user.email,
    name: user.name,
    patientCount: db.patients.filter((p) => p.primaryDoctorId === doctor.id).length,
  };
});

export const listAdminNotificationsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  return db.notifications
    .filter((n) => n.audience === "admin")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
});

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const db = await getDb();
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
      await saveDb();
    }
    return { success: true, readId: id };
  });

export const markAllAdminNotificationsReadFn = createServerFn({ method: "POST" }).handler(async () => {
  await requireAdmin();
  const db = await getDb();
  db.notifications.forEach((n) => {
    if (n.audience === "admin") {
      n.read = true;
    }
  });
  await saveDb();
  return { success: true };
});

export const markAllDoctorNotificationsReadFn = createServerFn({ method: "POST" }).handler(async () => {
  const user = await requireDoctor();
  const db = await getDb();
  db.notifications.forEach((n) => {
    if (n.audience === user.doctorId) {
      n.read = true;
    }
  });
  await saveDb();
  return { success: true };
});

export const getHospitalSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  return (
    db.settings ?? {
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
    }
  );
});

export const updateHospitalSettingsFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      hospitalName?: string;
      tagline?: string;
      contactEmail?: string;
      helplinePhone?: string;
      address?: string;
      opdHours?: string;
      normalFee?: number;
      emergencyFee?: number;
      upiId?: string;
      upiName?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const db = await getDb();
    db.settings = {
      hospitalName: data.hospitalName !== undefined ? data.hospitalName : (db.settings?.hospitalName ?? "Pulse Heart Centre"),
      tagline: data.tagline !== undefined ? data.tagline : (db.settings?.tagline ?? ""),
      contactEmail: data.contactEmail !== undefined ? data.contactEmail : (db.settings?.contactEmail ?? ""),
      helplinePhone: data.helplinePhone !== undefined ? data.helplinePhone : (db.settings?.helplinePhone ?? ""),
      address: data.address !== undefined ? data.address : (db.settings?.address ?? ""),
      opdHours: data.opdHours !== undefined ? data.opdHours : (db.settings?.opdHours ?? ""),
      normalFee: data.normalFee !== undefined ? Number(data.normalFee) : (db.settings?.normalFee ?? 500),
      emergencyFee: data.emergencyFee !== undefined ? Number(data.emergencyFee) : (db.settings?.emergencyFee ?? 1000),
      upiId: data.upiId !== undefined ? data.upiId : (db.settings?.upiId ?? "pulseheartcentre@upi"),
      upiName: data.upiName !== undefined ? data.upiName : (db.settings?.upiName ?? "Pulse Heart Centre"),
    };
    await saveDb();
    return { success: true, settings: db.settings };
  });



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
