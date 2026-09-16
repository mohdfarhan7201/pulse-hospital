import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  FileBarChart2,
  LayoutDashboard,
  Receipt,
  Settings,
  User,
  Users,
  BookOpen,
} from "lucide-react";

import { getSessionFn } from "@/lib/auth";
import { listMyNotificationsFn, getMyProfileFn } from "@/lib/api";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

const NAV_ITEMS: NavItem[] = [
  { to: "/doctor", label: "Dashboard", icon: <LayoutDashboard /> },
  { to: "/doctor/appointments", label: "My Appointments", icon: <CalendarDays /> },
  { to: "/doctor/patients", label: "Patients", icon: <Users /> },
  { to: "/doctor/billing", label: "Billing", icon: <Receipt /> },
  { to: "/doctor/reports", label: "Reports", icon: <FileBarChart2 /> },
  { to: "/doctor/notifications", label: "Notifications", icon: <Bell /> },
  { to: "/doctor/blogs", label: "Blogs", icon: <BookOpen /> },
  { to: "/doctor/profile", label: "Profile", icon: <User /> },
  { to: "/doctor/settings", label: "Settings", icon: <Settings /> },
];

const TITLES: Record<string, string> = {
  "/doctor": "Doctor Dashboard",
  "/doctor/appointments": "My Appointments",
  "/doctor/patients": "Patients",
  "/doctor/billing": "Billing & Payments",
  "/doctor/reports": "Reports",
  "/doctor/notifications": "Notifications",
  "/doctor/blogs": "Health Blogs & Articles",
  "/doctor/vlogs": "Health Blogs & Articles",
  "/doctor/profile": "Profile",
  "/doctor/settings": "Settings",
};

export const Route = createFileRoute("/doctor")({
  beforeLoad: async () => {
    let user = null;
    try {
      const res = await getSessionFn();
      user = res?.user ?? null;
    } catch {
      // serverless fallback
    }

    if (!user && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("pulse_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.role === "doctor") {
            user = parsed;
          }
        }
      } catch {
        // ignore
      }
    }

    if (!user || user.role !== "doctor") {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: DoctorLayout,
});

function DoctorLayout() {
  const { user } = Route.useRouteContext();
  const location = useLocation();
  const pageTitle = TITLES[location.pathname] ?? "Doctor Dashboard";

  const { data: notifications = [] } = useQuery({
    refetchInterval: 5000,
    queryKey: ["my-notifications"],
    queryFn: () => listMyNotificationsFn(),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => getMyProfileFn(),
    staleTime: 5000,
  });

  const activeUser = {
    ...user,
    photoUrl: profile?.photoUrl !== undefined ? profile.photoUrl : user.photoUrl,
    name: profile?.name || user.name,
  };

  return (
    <DashboardShell
      brandLabel="Doctor Dashboard"
      pageTitle={pageTitle}
      navItems={NAV_ITEMS}
      activeTo={location.pathname === "/doctor/" ? "/doctor" : location.pathname}
      user={activeUser}
      notificationCount={unreadCount}
    >
      <Outlet />
    </DashboardShell>
  );
}
