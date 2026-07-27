import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, HeartPulse, LogOut, Menu, X } from "lucide-react";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";
import { logoutFn, type PublicUser } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export function DashboardShell({
  brandLabel,
  pageTitle,
  navItems,
  activeTo,
  user,
  notificationCount = 0,
  children,
}: {
  brandLabel: string;
  pageTitle: string;
  navItems: NavItem[];
  activeTo: string;
  user: PublicUser;
  notificationCount?: number;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pulse_auth_user");
    }
    await logoutFn();
    await navigate({ to: "/login" });
  };

  const roleLabel = user.role === "admin" ? "Super Admin" : "Doctor";
  const subtitle =
    user.role === "admin" ? "Super Admin" : "Cardiologist";

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 h-screen w-64 shrink-0 overflow-y-auto border-r bg-card transition-transform lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:h-screen lg:w-64 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-card px-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <HeartPulse className="h-4.5 w-4.5" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">PULSE</p>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground">
              HOSPITAL
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const active = activeTo === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <span className="[&_svg]:h-4.5 [&_svg]:w-4.5">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main column */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-card px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg border lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">{pageTitle}</h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="relative grid h-9 w-9 place-items-center rounded-full border text-muted-foreground hover:bg-accent focus:outline-none transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="h-4.5 w-4.5" />
                  {notificationCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4.5 w-4.5 place-items-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {notificationCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0 shadow-lg">
                <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Notifications</span>
                  </div>
                  {notificationCount > 0 && (
                    <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs font-semibold">
                      {notificationCount} new
                    </span>
                  )}
                </div>
                <div className="p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    {notificationCount > 0
                      ? `You have ${notificationCount} unread notification${notificationCount > 1 ? "s" : ""}.`
                      : "You have no unread notifications."}
                  </p>
                  <Link
                    to={user.role === "admin" ? "/admin/notifications" : "/doctor/notifications"}
                    className="mt-3 inline-flex items-center justify-center w-full rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    View All Notifications
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full pr-1">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {user.avatarInitials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left leading-tight sm:block">
                    <span className="block text-sm font-semibold">{user.name}</span>
                    <span className="block text-xs text-muted-foreground">{subtitle}</span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-xs text-muted-foreground">{user.email}</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
