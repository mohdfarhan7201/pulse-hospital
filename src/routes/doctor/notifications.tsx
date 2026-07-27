import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  listMyNotificationsFn,
  markNotificationReadFn,
  markAllDoctorNotificationsReadFn,
} from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export const Route = createFileRoute("/doctor/notifications")({
  component: DoctorNotificationsPage,
});

function DoctorNotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const { data: notifications = [], isLoading } = useQuery({
    refetchInterval: 5000,
    queryKey: ["my-notifications"],
    queryFn: () => listMyNotificationsFn(),
  });

  // Individual single notification mark as read
  const markSingleReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationReadFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      toast.success("Notification marked as read");
    },
  });

  // Mark ALL doctor notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllDoctorNotificationsReadFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Doctor Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Patient appointment alerts, schedule changes, and clinic updates.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4 text-primary" />
            Mark all as read ({unreadCount})
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("all")}
          className="rounded-full"
        >
          All Notifications ({notifications.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilter("unread")}
          className="rounded-full gap-1.5"
        >
          Unread
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-1 rounded-full px-1.5 py-0 text-[10px]">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <Card className="p-2 sm:p-4">
        {isLoading && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Loading notifications…
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Sparkles className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-semibold text-foreground">No notifications found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {filter === "unread"
                ? "You have read all your notifications!"
                : "No patient or clinic notifications to display right now."}
            </p>
          </div>
        )}

        <ul className="divide-y">
          {filtered.map((n) => (
            <li
              key={n.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-colors rounded-lg ${
                !n.read ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary" : "hover:bg-accent/50"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <span
                  className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                    !n.read
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Bell className="h-4.5 w-4.5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{n.message}</p>
                    {!n.read ? (
                      <Badge variant="default" className="text-[10px] bg-primary">
                        Unread
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        Read
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{n.createdAt}</p>
                </div>
              </div>

              {!n.read && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={() => markSingleReadMutation.mutate(n.id)}
                  disabled={markSingleReadMutation.isPending}
                >
                  <Check className="h-3.5 w-3.5" /> Mark as read
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
