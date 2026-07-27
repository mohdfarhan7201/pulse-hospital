import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HeartPulse, Loader2, Lock, Mail, ShieldCheck, Stethoscope } from "lucide-react";
import { useState } from "react";

import logo1 from "@/assets/logo1.png";
import { cn } from "@/lib/utils";
import { getSessionFn, loginFn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign in · Pulse Heart Centre" }],
  }),
  beforeLoad: async () => {
    const { user } = await getSessionFn();
    return { currentUser: user };
  },
  component: LoginPage,
});

type RoleTab = "admin" | "doctor";

function LoginPage() {
  const { currentUser } = Route.useRouteContext();
  const navigate = useNavigate();
  const [role, setRole] = useState<RoleTab>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fillDemo = () => {
    if (role === "admin") {
      setEmail("admin@pulseheart.com");
      setPassword("Admin@123");
    } else {
      setEmail("amit.verma@pulseheart.com");
      setPassword("Doctor@123");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user } = await loginFn({ data: { email, password, role } });
      if (typeof window !== "undefined") {
        localStorage.setItem("pulse_user", JSON.stringify(user));
      }
      await navigate({ to: user.role === "admin" ? "/admin" : "/doctor" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand side */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[oklch(0.18_0.05_265)] p-10 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(ellipse at 20% 10%, oklch(0.35 0.16 265 / 0.9), transparent 60%), radial-gradient(ellipse at 80% 30%, oklch(0.6 0.16 210 / 0.55), transparent 60%), radial-gradient(ellipse at 60% 90%, oklch(0.55 0.22 20 / 0.35), transparent 60%)",
          }}
        />
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white">
            <img src={logo1} alt="Pulse Heart Centre" className="h-full w-full object-contain p-1" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-[0.22em] uppercase text-white/70">
              Pulse Heart
            </span>
            <span className="font-display text-lg font-bold">Centre</span>
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="font-display text-3xl font-bold leading-tight">
            Rhythm of Life — <br /> run your hospital in one place.
          </h2>
          <p className="mt-4 max-w-md text-sm text-white/70">
            Manage doctors, patients, appointments and revenue from a single, secure dashboard
            built for Pulse Heart Centre's care teams.
          </p>
        </div>

        <p className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} Pulse Heart Centre, Gorakhpur. All rights reserved.
        </p>
      </div>

      {/* Form side */}
      <div className="flex items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold">Pulse Heart Centre</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access your Pulse Hospital dashboard.
          </p>

          {currentUser && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-foreground">
              <p className="font-semibold">
                Signed in as <span className="text-primary">{currentUser.name}</span> ({currentUser.role})
              </p>
              <div className="mt-1.5 flex items-center gap-3">
                <Link
                  to={currentUser.role === "admin" ? "/admin" : "/doctor"}
                  className="font-medium text-primary hover:underline"
                >
                  Go to {currentUser.role === "admin" ? "Admin" : "Doctor"} Dashboard →
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors",
                role === "admin"
                  ? "bg-card shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </button>
            <button
              type="button"
              onClick={() => setRole("doctor")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition-colors",
                role === "doctor"
                  ? "bg-card shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Stethoscope className="h-4 w-4" /> Doctor
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder={role === "admin" ? "admin@pulseheart.com" : "doctor@pulseheart.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Sign in as {role === "admin" ? "Admin" : "Doctor"}
            </Button>

            <button
              type="button"
              onClick={fillDemo}
              className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Use demo {role} credentials
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="font-medium text-foreground hover:underline">
              ← Back to hospital website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
