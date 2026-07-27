import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  LayoutDashboard,
  Settings,
  User,
  Users,
} from "lucide-react";

import { getSessionFn } from "@/lib/auth";
import { listMyNotificationsFn } from "@/lib/api";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

const NAV_ITEMS: NavItem[] = [
  { to: "/doctor", label: "Dashboard", icon: <LayoutDashboard /> },
  { to: "/doctor/appointments", label: "My Appointments", icon: <CalendarDays /> },
  { to: "/doctor/patients", label: "Patients", icon: <Users /> },
  { to: "/doctor/notifications", label: "Notifications", icon: <Bell /> },
  { to: "/doctor/profile", label: "Profile", icon: <User /> },
  { to: "/doctor/settings", label: "Settings", icon: <Settings /> },
];

const TITLES: Record<string, string> = {
  "/doctor": "Doctor Dashboard",
  "/doctor/appointments": "My Appointments",
  "/doctor/patients": "Patients",
  "/doctor/notifications": "Notifications",
  "/doctor/profile": "Profile",
  "/doctor/settings": "Settings",
};

export const Route = createFileRoute("/doctor")({
  beforeLoad: async () => {
    const { user } = await getSessionFn();
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
    queryKey: ["my-notifications"],
    queryFn: () => listMyNotificationsFn(),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardShell
      brandLabel="Doctor Dashboard"
      pageTitle={pageTitle}
      navItems={NAV_ITEMS}
      activeTo={location.pathname === "/doctor/" ? "/doctor" : location.pathname}
      user={user}
      notificationCount={unreadCount}
    >
      <Outlet />
    </DashboardShell>
  );
}
