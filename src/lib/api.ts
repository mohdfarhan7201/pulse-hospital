import { createServerFn } from "@tanstack/react-start";

import { getDb, saveDb, newId, hashPassword, verifyPassword, type AppointmentStatus, type AppointmentRecord, type BlogRecord, type VlogRecord, type InvoiceRecord } from "./server/db";
import { getSessionFn } from "./auth";

export type { AppointmentStatus, AppointmentRecord, BlogRecord, VlogRecord, InvoiceRecord };

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
  await requireDoctor();
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
  await requireDoctor();
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

    const doctor = db.doctors.find((d) => d.id === data.doctorId) || (db.doctors.length > 0 ? db.doctors[0] : null);
    const doctorId = doctor ? doctor.id : (data.doctorId || "doc-prakash");
    const doctorName = doctor ? doctor.name : "Dr. Prakash Chand Shahi";

    const cleanPhone = data.phone.trim();
    const cleanEmail = data.email?.trim() || "";
    const cleanName = data.patientName.trim();
    const cleanDepartment = data.department || doctor?.department || "Cardiology";

    // Match patient by both phone and name (case-insensitive)
    // If name matches, it is the same patient returning for an appointment
    let patient = db.patients.find(
      (p) =>
        p.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, "") &&
        p.name.trim().toLowerCase() === cleanName.toLowerCase()
    );

    if (!patient) {
      // New patient (or same phone with a different person/name)
      patient = {
        id: newId("pat"),
        name: cleanName,
        age: data.age || 30,
        gender: data.gender || "Male",
        phone: cleanPhone,
        email: cleanEmail,
        department: cleanDepartment,
        primaryDoctorId: doctorId,
        lastVisit: data.date,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      db.patients.push(patient);
    } else {
      // Existing patient returning for follow-up
      if (cleanEmail) patient.email = cleanEmail;
      if (data.age) patient.age = data.age;
      if (data.gender) patient.gender = data.gender;
      if (cleanDepartment) patient.department = cleanDepartment;
      patient.lastVisit = data.date;
      patient.primaryDoctorId = doctorId;
    }

    const apptId = newId("apt");
    const appointment: AppointmentRecord = {
      id: apptId,
      patientId: patient.id,
      patientName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      age: patient.age,
      gender: patient.gender,
      doctorId: doctorId,
      doctorName,
      department: cleanDepartment,
      date: data.date,
      time: data.time || "10:00 AM",
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

    // Automatically generate invoice for the appointment
    const consultationFee = db.settings?.normalFee ?? 500;
    const invoiceId = newId("inv");
    db.invoices.push({
      id: invoiceId,
      patientId: patient.id,
      patientName: cleanName,
      phone: cleanPhone,
      service: `Consultation - ${cleanDepartment}`,
      paymentMethod: "Pending at Counter",
      appointmentId: apptId,
      amount: consultationFee,
      status: "Pending",
      date: data.date,
      createdAt: new Date().toISOString(),
    });

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
    await requireDoctor();
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
    await requireDoctor();
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
    await requireDoctor();
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
  await requireDoctor();
  const db = await getDb();
  return db.patients.map((p) => ({
    ...p,
    doctorName: db.doctors.find((d) => d.id === p.primaryDoctorId)?.name ?? "Unassigned",
  }));
});

export const listDepartmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireDoctor();
  const db = await getDb();
  const names = [...new Set(["Cardiology", "Diagnostics", ...db.doctors.map((d) => d.department)])];
  return names.map((name) => ({
    name,
    doctorCount: db.doctors.filter((d) => d.department === name || name === "Diagnostics").length,
    patientCount: db.patients.filter((p) => p.department === name).length,
  }));
});

export const listAllAppointmentsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireDoctor();
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
  await requireDoctor();
  const db = await getDb();

  // Ensure every appointment has an invoice
  const existingApptInvoiceIds = new Set(db.invoices.map((i) => i.appointmentId).filter(Boolean));
  let modified = false;

  for (const appt of db.appointments) {
    if (!existingApptInvoiceIds.has(appt.id)) {
      const fee = db.settings?.normalFee ?? 500;
      db.invoices.push({
        id: `inv-${appt.id.replace(/^apt-/, "")}`,
        patientId: appt.patientId,
        patientName: appt.patientName,
        phone: appt.phone,
        service: `Consultation - ${appt.department}`,
        appointmentId: appt.id,
        amount: fee,
        status: appt.status === "Completed" ? "Paid" : "Pending",
        date: appt.date,
        createdAt: appt.createdAt || new Date().toISOString(),
      });
      modified = true;
    }
  }

  // Remove obsolete dummy invoices from patients/appointments that no longer exist
  const validApptIds = new Set(db.appointments.map((a) => a.id));
  const beforeCount = db.invoices.length;
  db.invoices = db.invoices.filter((inv) => !inv.appointmentId || validApptIds.has(inv.appointmentId));
  if (db.invoices.length !== beforeCount) {
    modified = true;
  }

  if (modified) {
    await saveDb();
  }

  const invoices = [...db.invoices].sort((a, b) => (a.date < b.date ? 1 : -1));
  const totalPaid = invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === "Pending").reduce((s, i) => s + i.amount, 0);

  return { invoices, totalPaid, totalPending, settings: db.settings };
});

export const updateInvoiceStatusFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; status: "Paid" | "Pending"; paymentMethod?: string }) => data)
  .handler(async ({ data }) => {
    await requireDoctor();
    const db = await getDb();
    const inv = db.invoices.find((i) => i.id === data.id);
    if (!inv) throw new Error("Invoice not found");
    inv.status = data.status;
    if (data.paymentMethod) {
      inv.paymentMethod = data.paymentMethod;
    }
    await saveDb();
    return inv;
  });

export const createInvoiceFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      patientName: string;
      patientId?: string;
      phone?: string;
      service: string;
      amount: number;
      status: "Paid" | "Pending";
      paymentMethod?: string;
      date?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    await requireDoctor();
    const db = await getDb();
    const cleanName = data.patientName.trim();
    const cleanPhone = data.phone?.trim() || "";

    let patient = data.patientId ? db.patients.find((p) => p.id === data.patientId) : undefined;
    if (!patient && cleanPhone) {
      patient = db.patients.find(
        (p) => p.phone.replace(/\D/g, "") === cleanPhone.replace(/\D/g, "")
      );
    }
    const patId = patient ? patient.id : (data.patientId || newId("pat"));

    const dateStr = data.date || new Date().toISOString().slice(0, 10);
    const invoiceId = newId("inv");
    const newInvoice: InvoiceRecord = {
      id: invoiceId,
      patientId: patId,
      patientName: cleanName,
      phone: cleanPhone || (patient?.phone ?? ""),
      service: data.service.trim() || "OPD Consultation",
      paymentMethod: data.paymentMethod || "Cash",
      appointmentId: "",
      amount: Number(data.amount) || 0,
      status: data.status,
      date: dateStr,
      createdAt: new Date().toISOString(),
    };

    db.invoices.push(newInvoice);
    await saveDb();
    return newInvoice;
  });

export const deleteInvoiceFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await requireDoctor();
    const db = await getDb();
    db.invoices = db.invoices.filter((i) => i.id !== id);
    await saveDb();
    return { success: true };
  });

export const getAdminReportsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireDoctor();
  const db = await getDb();

  const totalAppointments = db.appointments.length;
  const totalPatients = db.patients.length;

  const ALL_STATUSES = ["Confirmed", "In Consultation", "Waiting", "Pending", "Completed", "Cancelled"];
  const statusCounts: Record<string, number> = {};
  for (const s of ALL_STATUSES) {
    statusCounts[s] = 0;
  }
  for (const a of db.appointments) {
    statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;
  }

  const completedCount = statusCounts["Completed"] || 0;
  const completionRate = totalAppointments > 0 ? Math.round((completedCount / totalAppointments) * 100) : 0;

  // Department counts
  const departmentCounts: Record<string, number> = {};
  for (const a of db.appointments) {
    const dept = a.department || "Cardiology";
    departmentCounts[dept] = (departmentCounts[dept] ?? 0) + 1;
  }

  // Financial statistics from real invoices
  const totalRevenue = db.invoices.reduce((s, i) => s + i.amount, 0);
  const paidRevenue = db.invoices.filter((i) => i.status === "Paid").reduce((s, i) => s + i.amount, 0);
  const pendingRevenue = db.invoices.filter((i) => i.status === "Pending").reduce((s, i) => s + i.amount, 0);

  // Demographics: Gender breakdown
  const genderCounts: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
  for (const p of db.patients) {
    if (p.gender in genderCounts) {
      genderCounts[p.gender] = (genderCounts[p.gender] ?? 0) + 1;
    } else {
      genderCounts["Other"] = (genderCounts["Other"] ?? 0) + 1;
    }
  }

  // Recent consultation reports list
  const recentConsultations = [...db.appointments]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((a) => {
      const inv = db.invoices.find((i) => i.appointmentId === a.id);
      return {
        id: a.id,
        patientName: a.patientName,
        phone: a.phone || "",
        age: a.age,
        gender: a.gender,
        department: a.department,
        doctorName: a.doctorName || "Dr. Prakash Chand Shahi",
        date: a.date,
        time: a.time || "10:00 AM",
        status: a.status,
        amount: inv ? inv.amount : (db.settings?.normalFee ?? 500),
        paymentStatus: inv ? inv.status : "Pending",
      };
    });

  return {
    totalAppointments,
    totalPatients,
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    completedCount,
    completionRate,
    statusCounts,
    departmentCounts,
    genderCounts,
    recentConsultations,
    hospitalName: db.settings?.hospitalName || "Pulse Heart Centre",
    helplinePhone: db.settings?.helplinePhone || "+91 98765 43210",
  };
});

// ---------------------------------------------------------------------------
// Doctor
// ---------------------------------------------------------------------------

export const getDoctorOverviewFn = createServerFn({ method: "GET" })
  .validator((data?: { date?: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireDoctor();
    const db = await getDb();
    const today = new Date().toISOString().slice(0, 10);
    const doctorId = user.doctorId!;

    const myAppointments = db.appointments.filter((a) => a.doctorId === doctorId);
    const targetDate = data?.date || today;

    const todays = myAppointments
      .filter((a) => a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));

    const selectedAppointments = (targetDate === "all"
      ? myAppointments
      : myAppointments.filter((a) => a.date === targetDate)
    ).sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : (a.date < b.date ? 1 : -1)));

    const upcoming = selectedAppointments.filter((a) => a.status === "Confirmed" || a.status === "Pending");
    const completed = selectedAppointments.filter((a) => a.status === "Completed");
    const waiting = selectedAppointments.filter((a) => a.status === "Waiting");

    const week = lastNDaysLabelsAndDates(7).map(({ label, date }) => ({
      day: label,
      patients: new Set(
        myAppointments.filter((a) => a.date === date).map((a) => a.patientId),
      ).size,
    }));

    const myApptPatientIds = new Set(
      myAppointments.map((a) => a.patientId)
    );
    const myPatients = db.patients.filter((p) => 
      p.primaryDoctorId === doctorId || 
      myApptPatientIds.has(p.id) || 
      !db.doctors.some((d) => d.id === p.primaryDoctorId)
    );
    const newPatients = myPatients.filter(
      (p) => new Date(p.createdAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 30,
    );

    const recentPatients = [...myPatients]
      .sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : -1))
      .slice(0, 4);

    const availableDates = Array.from(new Set(myAppointments.map((a) => a.date))).sort().reverse();

    return {
      todaysAppointmentsCount: todays.length,
      selectedAppointmentsCount: selectedAppointments.length,
      upcomingCount: upcoming.length,
      nextUpcomingTime: upcoming[0]?.time ?? null,
      completedCount: completed.length,
      waitingCount: waiting.length,
      todaysAppointments: todays,
      selectedAppointments,
      allAppointments: myAppointments.sort((a, b) => (a.date < b.date ? 1 : a.time.localeCompare(b.time))),
      targetDate,
      availableDates,
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
      const calculatedTokenNo = tokenIndex >= 0 ? tokenIndex + 1 : idx + 1;
      const formattedToken = String(calculatedTokenNo).padStart(2, "0");
      const dateClean = (a.date || "").replace(/-/g, "");

      return {
        ...a,
        tokenNo: a.tokenNo || formattedToken,
        displayId: `#PHC-${dateClean}-${a.tokenNo || formattedToken}`,
      };
    });
  });

export const listMyPatientsFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await requireDoctor();
  const db = await getDb();
  
  const myApptPatientIds = new Set(
    db.appointments.filter((a) => a.doctorId === user.doctorId).map((a) => a.patientId)
  );

  return db.patients
    .filter((p) =>
      p.primaryDoctorId === user.doctorId ||
      myApptPatientIds.has(p.id) ||
      !db.doctors.some((d) => d.id === p.primaryDoctorId)
    )
    .map((p) => {
      const patientAppts = db.appointments
        .filter((a) => a.patientId === p.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const latestAppt = patientAppts[0];

      const displayName = latestAppt?.patientName || p.name;
      const displayPhone = latestAppt?.phone || p.phone;
      const displayEmail = latestAppt?.email || p.email;

      return {
        ...p,
        name: displayName,
        phone: displayPhone,
        email: displayEmail,
        totalAppointments: patientAppts.length,
        latestStatus: latestAppt?.status ?? "Active",
        latestDate: latestAppt?.date ?? p.lastVisit,
      };
    })
    .sort((a, b) => (a.lastVisit < b.lastVisit ? 1 : -1));
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
  await requireDoctor();
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
  await requireDoctor();
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
      secondaryPhone: "",
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
      secondaryPhone?: string;
      address?: string;
      opdHours?: string;
      normalFee?: number;
      emergencyFee?: number;
      upiId?: string;
      upiName?: string;
    }) => data
  )
  .handler(async ({ data }) => {
    await requireDoctor();
    const db = await getDb();
    db.settings = {
      hospitalName: data.hospitalName !== undefined ? data.hospitalName : (db.settings?.hospitalName ?? "Pulse Heart Centre"),
      tagline: data.tagline !== undefined ? data.tagline : (db.settings?.tagline ?? ""),
      contactEmail: data.contactEmail !== undefined ? data.contactEmail : (db.settings?.contactEmail ?? ""),
      helplinePhone: data.helplinePhone !== undefined ? data.helplinePhone : (db.settings?.helplinePhone ?? ""),
      secondaryPhone: data.secondaryPhone !== undefined ? data.secondaryPhone : (db.settings?.secondaryPhone ?? ""),
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
  .validator((data: { name?: string; email?: string; phone?: string; experienceYears?: number; department?: string; specialty?: string; qualification?: string; password?: string; newPassword?: string; photoUrl?: string }) => data)
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
    if (data.photoUrl !== undefined) doctor.photoUrl = data.photoUrl;

    await saveDb();
    return { success: true };
  });

// ---------------------------------------------------------------------------
// Vlogs & Videos (aliases provided for backward compatibility)
// ---------------------------------------------------------------------------

export const listVlogsFn = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getDb();
  return [...db.blogs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
});
export const listBlogsFn = listVlogsFn;

export const getVlogFn = createServerFn({ method: "GET" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    const db = await getDb();
    const blog = db.blogs.find((b) => b.id === id);
    if (!blog) throw new Error("Vlog not found");
    return blog;
  });
export const getBlogFn = getVlogFn;

export const createVlogFn = createServerFn({ method: "POST" })
  .validator((data: { title: string; content?: string; imageUrl?: string; videoUrl?: string }) => data)
  .handler(async ({ data }) => {
    const user = await requireDoctor();
    const db = await getDb();
    
    const blog: BlogRecord = {
      id: newId("vlog"),
      title: data.title.trim(),
      content: (data.content || "").trim(),
      imageUrl: data.imageUrl?.trim(),
      videoUrl: data.videoUrl?.trim(),
      createdAt: new Date().toISOString(),
      authorId: user.doctorId!,
    };
    
    db.blogs.push(blog);
    await saveDb();
    return blog;
  });
export const createBlogFn = createVlogFn;

export const updateVlogFn = createServerFn({ method: "POST" })
  .validator((data: { id: string; title: string; content?: string; imageUrl?: string; videoUrl?: string }) => data)
  .handler(async ({ data }) => {
    await requireDoctor();
    const db = await getDb();
    
    const blog = db.blogs.find((b) => b.id === data.id);
    if (!blog) throw new Error("Vlog not found");
    
    blog.title = data.title.trim();
    if (data.content !== undefined) blog.content = data.content.trim();
    if (data.imageUrl !== undefined) blog.imageUrl = data.imageUrl.trim();
    if (data.videoUrl !== undefined) blog.videoUrl = data.videoUrl.trim();
    
    await saveDb();
    return blog;
  });
export const updateBlogFn = updateVlogFn;

export const deleteVlogFn = createServerFn({ method: "POST" })
  .validator((id: string) => id)
  .handler(async ({ data: id }) => {
    await requireDoctor();
    const db = await getDb();
    
    db.blogs = db.blogs.filter((b) => b.id !== id);
    await saveDb();
    return { ok: true };
  });
export const deleteBlogFn = deleteVlogFn;
