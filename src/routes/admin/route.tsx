import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  FileBarChart2,
  LayoutDashboard,
  Receipt,
  Settings,
  Stethoscope,
} from "lucide-react";

import { getSessionFn } from "@/lib/auth";
import { listAdminNotificationsFn } from "@/lib/api";
import { DashboardShell, type NavItem } from "@/components/dashboard/DashboardShell";

const NAV_ITEMS: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard /> },
  { to: "/admin/doctors", label: "Doctors", icon: <Stethoscope /> },
  { to: "/admin/appointments", label: "Appointments", icon: <CalendarDays /> },
  { to: "/admin/notifications", label: "Notifications", icon: <Bell /> },
  { to: "/admin/reports", label: "Reports", icon: <FileBarChart2 /> },
  { to: "/admin/settings", label: "Settings", icon: <Settings /> },
];

const TITLES: Record<string, string> = {
  "/admin": "Admin Dashboard",
  "/admin/doctors": "Doctors",
  "/admin/appointments": "Appointments",
  "/admin/notifications": "Notifications",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
};

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { user } = await getSessionFn();
    if (!user || user.role !== "admin") {
      throw redirect({ to: "/login" });
    }
    return { user };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = Route.useRouteContext();
  const location = useLocation();
  const pageTitle = TITLES[location.pathname] ?? "Admin Dashboard";

  const { data: notifications = [] } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => listAdminNotificationsFn(),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DashboardShell
      brandLabel="Admin Dashboard"
      pageTitle={pageTitle}
      navItems={NAV_ITEMS}
      activeTo={location.pathname === "/admin/" ? "/admin" : location.pathname}
      user={user}
      notificationCount={unreadCount}
    >
      <Outlet />
    </DashboardShell>
  );
}

