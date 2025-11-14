import { Suspense } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  CheckSquare,
  AlertTriangle,
  Ticket,
  ArrowRight,
} from "lucide-react";
import { StatsCard } from "~/components/stats-card";
import {
  getEventById,
  getTasksByEvent,
  getTeamsByEvent,
  getAllFailedWebhooks,
  getAllAttendees,
  getDashboardStats,
} from "~/server/queries";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function EventDashboardContent({ eventId }: { eventId: string }) {
  const eventIdNum = parseInt(eventId);

  if (isNaN(eventIdNum)) {
    notFound();
  }

  const [event, tasks, teams, failedWebhooks, allAttendees, dashboardStats] =
    await Promise.all([
      getEventById(eventIdNum),
      getTasksByEvent(eventIdNum),
      getTeamsByEvent(eventIdNum),
      getAllFailedWebhooks(),
      getAllAttendees(),
      getDashboardStats(),
    ]);

  if (!event) {
    notFound();
  }

  // Calculate stats from real data
  // Since attendees are global in current schema, we'll use dashboard stats for attendee info
  const totalAttendees = dashboardStats.totalUsers;
  const checkedIn = dashboardStats.attendedUsers;
  const pendingTasks = tasks.filter(
    (t) => t.status === "backlog" || t.status === "in-progress"
  ).length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const activeTeams = teams.length;
  const eventFailedWebhooks = failedWebhooks.filter(
    (w) => w.status === "pending"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Dashboard</h1>
          <p className="text-muted-foreground">
            Overview and analytics for Event {eventId}
          </p>
        </div>
        <Badge variant={eventFailedWebhooks > 0 ? "destructive" : "secondary"}>
          {eventFailedWebhooks > 0
            ? "Issues Detected"
            : "All Systems Operational"}
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Attendees"
          value={totalAttendees}
          description="Global attendee count"
          icon={Users}
          trend={{
            value: totalAttendees,
            label: "total registered",
            isPositive: true,
          }}
        />
        <StatsCard
          title="Checked In"
          value={checkedIn}
          description={`${Math.round((checkedIn / Math.max(totalAttendees, 1)) * 100)}% attendance rate`}
          icon={UserCheck}
          trend={{
            value: Math.round((checkedIn / Math.max(totalAttendees, 1)) * 100),
            label: "attendance rate",
            isPositive: checkedIn > 0,
          }}
        />
        <StatsCard
          title="Pending Tasks"
          value={pendingTasks}
          description={`${completedTasks} completed`}
          icon={CheckSquare}
          trend={{
            value: completedTasks,
            label: "completed",
            isPositive: completedTasks > pendingTasks,
          }}
        />
        <StatsCard
          title="Failed Webhooks"
          value={eventFailedWebhooks}
          description="Requires attention"
          icon={AlertTriangle}
          trend={{
            value: eventFailedWebhooks,
            label: "pending failures",
            isPositive: eventFailedWebhooks === 0,
          }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Manage Tickets</CardTitle>
            </div>
            <CardDescription>
              Send tickets, track delivery status, and manage attendee
              communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendees}</div>
            <p className="text-xs text-muted-foreground">
              tickets ready to send
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Task Management</CardTitle>
            </div>
            <CardDescription>
              Track project progress, assign tasks, and manage deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              tasks need attention
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Team Collaboration</CardTitle>
            </div>
            <CardDescription>
              Manage team members, roles, and permissions for this event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTeams}</div>
            <p className="text-xs text-muted-foreground">active teams</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest updates and changes for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <UserCheck className="h-4 w-4 text-green-600" />
              <span>5 new attendees checked in</span>
              <span className="text-muted-foreground ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              <span>Task "Setup registration desk" completed</span>
              <span className="text-muted-foreground ml-auto">15 min ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span>2 webhook failures detected</span>
              <span className="text-muted-foreground ml-auto">1 hour ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Ticket className="h-4 w-4 text-purple-600" />
              <span>25 tickets sent successfully</span>
              <span className="text-muted-foreground ml-auto">2 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface DashboardPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { eventId } = await params;

  return (
    <Suspense
      fallback={<div className="animate-pulse">Loading dashboard...</div>}
    >
      <EventDashboardContent eventId={eventId} />
    </Suspense>
  );
}
