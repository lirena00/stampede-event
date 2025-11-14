import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Mail,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Download,
} from "lucide-react";
import { getEventById, getDashboardStats } from "~/server/queries";

export const dynamic = "force-dynamic";

async function EventTicketsContent({ eventId }: { eventId: string }) {
  const eventIdNum = parseInt(eventId);

  if (Number.isNaN(eventIdNum)) {
    notFound();
  }

  const [event, dashboardStats] = await Promise.all([
    getEventById(eventIdNum),
    getDashboardStats(),
  ]);

  if (!event) {
    notFound();
  }

  const ticketStats = {
    totalAttendees: dashboardStats.totalUsers,
    ticketsSent: dashboardStats.ticketsSentUsers,
    ticketsDelivered: dashboardStats.ticketsSentUsers, // Assuming all sent are delivered for now
    ticketsFailed: 0, // No failed tickets tracked currently
    pendingTickets: dashboardStats.ticketsNotSentUsers,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Tickets</h1>
          <p className="text-muted-foreground">
            Manage and send tickets for Event {eventId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Send className="h-4 w-4 mr-2" />
            Send Pending
          </Button>
        </div>
      </div>

      {/* Ticket Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">
                Total Attendees
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ticketStats.totalAttendees}
            </div>
            <p className="text-xs text-muted-foreground">
              registered participants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-sm font-medium">
                Tickets Sent
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ticketStats.ticketsSent}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (ticketStats.ticketsSent / ticketStats.totalAttendees) * 100
              )}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ticketStats.ticketsDelivered}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round(
                (ticketStats.ticketsDelivered / ticketStats.ticketsSent) * 100
              )}
              % delivery rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ticketStats.pendingTickets}
            </div>
            <p className="text-xs text-muted-foreground">awaiting delivery</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>
              Perform actions on multiple tickets at once
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="default">
              <Send className="h-4 w-4 mr-2" />
              Send All Pending Tickets
            </Button>
            <Button className="w-full" variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Resend Failed Tickets
            </Button>
            <Button className="w-full" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download QR Codes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket Status Overview</CardTitle>
            <CardDescription>
              Current status of all event tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Delivered</span>
              </div>
              <Badge variant="secondary">{ticketStats.ticketsDelivered}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Pending</span>
              </div>
              <Badge variant="secondary">{ticketStats.pendingTickets}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Failed</span>
              </div>
              <Badge variant="destructive">{ticketStats.ticketsFailed}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Ticket Activity</CardTitle>
          <CardDescription>
            Latest ticket sending and delivery updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>25 tickets delivered successfully</span>
              <span className="text-muted-foreground ml-auto">5 min ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Send className="h-4 w-4 text-blue-600" />
              <span>Batch of 50 tickets sent</span>
              <span className="text-muted-foreground ml-auto">30 min ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <XCircle className="h-4 w-4 text-red-600" />
              <span>3 ticket deliveries failed - retrying</span>
              <span className="text-muted-foreground ml-auto">1 hour ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-purple-600" />
              <span>Email template updated</span>
              <span className="text-muted-foreground ml-auto">2 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TicketsPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function TicketsPage({ params }: TicketsPageProps) {
  const { eventId } = await params;

  return (
    <Suspense
      fallback={<div className="animate-pulse">Loading tickets...</div>}
    >
      <EventTicketsContent eventId={eventId} />
    </Suspense>
  );
}
