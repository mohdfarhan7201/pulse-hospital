import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { randomUUID } from "node:crypto";

import { getDb, saveDb, verifyPassword, type Role } from "./server/db";

const SESSION_COOKIE = "pulse_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  doctorId?: string;
  avatarInitials: string;
}

function toPublicUser(user: ReturnType<typeof getDb>["users"][number]): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    doctorId: user.doctorId,
    avatarInitials: user.avatarInitials,
  };
}

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string; role: Role }) => data)
  .handler(async ({ data }) => {
    const db = getDb();
    const email = data.email.trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === email && u.role === data.role);

    if (!user || !verifyPassword(data.password, user.passwordHash)) {
      throw new Error("Invalid email or password for the selected role.");
    }

    const sessionId = randomUUID();
    const now = new Date();
    db.sessions[sessionId] = {
      userId: user.id,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    };
    saveDb();

    setCookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
    });

    return { user: toPublicUser(user) };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const sessionId = getCookie(SESSION_COOKIE);
  if (sessionId) {
    const db = getDb();
    delete db.sessions[sessionId];
    saveDb();
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const sessionId = getCookie(SESSION_COOKIE);
  if (!sessionId) return { user: null as PublicUser | null };

  const db = getDb();
  const session = db.sessions[sessionId];
  if (!session) return { user: null as PublicUser | null };

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    delete db.sessions[sessionId];
    saveDb();
    return { user: null as PublicUser | null };
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) return { user: null as PublicUser | null };

  return { user: toPublicUser(user) };
});

/** Throws a redirect-friendly error if there is no authenticated user with the given role. */
export async function requireRole(role: Role): Promise<PublicUser> {
  const { user } = await getSessionFn();
  if (!user || user.role !== role) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}
