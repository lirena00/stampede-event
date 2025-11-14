import Header from "~/components/Header";
import { getAllAttendees, getDashboardStats } from "~/server/queries";
import { userColumns } from "~/components/user-columns";
import { DataTable } from "~/components/data-table";
import { StatsCard } from "~/components/stats-card";
import {
  Users,
  UserCheck,
  Calendar,
  TrendingUp,
  Mail,
  Ticket,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { useSession } from "~/lib/auth-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { data: session } = useSession();
  const [users, stats] = await Promise.all([
    getAllAttendees(),
    getDashboardStats(),
  ]);

  const attendanceRate =
    stats.totalUsers > 0
      ? Math.round((stats.attendedUsers / stats.totalUsers) * 100)
      : 0;

  const ticketSentRate =
    stats.totalUsers > 0
      ? Math.round((stats.ticketsSentUsers / stats.totalUsers) * 100)
      : 0;

  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header />

        {/* Dashboard Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Dashboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Welcome to your event management dashboard. Monitor attendance,
            manage participants, and track engagement.
          </p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Registered"
            value={stats.registeredUsers - 12}
            description={`${stats.totalUsers - 12} total participants`}
            icon={Users}
          />
          <StatsCard
            title="Event Attendance"
            value={stats.attendedUsers}
            description={`${attendanceRate}% attendance rate`}
            icon={UserCheck}
            trend={{
              value: attendanceRate,
              label: "attendance rate",
              isPositive: attendanceRate > 50,
            }}
          />
          <StatsCard
            title="Email Tickets Sent"
            value={stats.ticketsSentUsers - 12}
            description={`${ticketSentRate}% of participants`}
            icon={Ticket}
            trend={{
              value: ticketSentRate,
              label: "tickets sent",
              isPositive: ticketSentRate > 70,
            }}
          />
          <StatsCard
            title="Pending Actions"
            value={stats.ticketsNotSentUsers}
            description="Participants without tickets"
            icon={Mail}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="tickets">Email Tickets</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                  <CardDescription>Key metrics at a glance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Registration Status
                    </span>
                    <Badge variant="secondary">
                      {stats.registeredUsers - 12} registered
                    </Badge>
                  </div>
                  {/* <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Event Attendance
                    </span>
                    <Badge
                      variant={stats.attendedUsers > 0 ? "default" : "outline"}
                    >
                      {stats.attendedUsers - 12} attended
                    </Badge>
                  </div> */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Email Tickets</span>
                    <Badge
                      variant={
                        stats.ticketsSentUsers > 0 ? "default" : "outline"
                      }
                    >
                      {stats.ticketsSentUsers - 12} sent
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending Tickets</span>
                    <Badge
                      variant={
                        stats.ticketsNotSentUsers > 0
                          ? "destructive"
                          : "outline"
                      }
                    >
                      {stats.ticketsNotSentUsers} pending
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Attendance Rate</span>
                    <Badge
                      variant={attendanceRate > 50 ? "default" : "secondary"}
                    >
                      {attendanceRate}% completed
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest participant registrations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {users.length > 0 ? (
                      <div className="space-y-2">
                        {users.slice(0, 3).map((user) => {
                          const createdAt = user.created_at
                            ? new Date(user.created_at)
                            : null;
                          const timeAgo = createdAt
                            ? (() => {
                                const now = new Date();
                                const diffInHours = Math.floor(
                                  (now.getTime() - createdAt.getTime()) /
                                    (1000 * 60 * 60)
                                );
                                const diffInDays = Math.floor(diffInHours / 24);

                                if (diffInHours < 1) return "Just now";
                                if (diffInHours < 24)
                                  return `${diffInHours}h ago`;
                                if (diffInDays < 7) return `${diffInDays}d ago`;
                                return createdAt.toLocaleDateString();
                              })()
                            : "Unknown";

                          return (
                            <div
                              key={user.id}
                              className="flex items-center justify-between rounded-lg border p-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-full">
                                  <Users className="text-primary h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">
                                    {user.name}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    Registered
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-muted-foreground text-xs">
                                  {timeAgo}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {user.status}
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                        {users.length > 3 && (
                          <div className="pt-2 text-center">
                            <Button variant="outline" size="sm" asChild>
                              <a href="#participants">View all participants</a>
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        No recent activity to display. Upload participants or
                        check attendance to see updates here.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent
            value="participants"
            className="space-y-6"
            id="participants"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Participants List
                </CardTitle>
                <CardDescription>
                  Manage and track all event participants. Default sorted by
                  registration date (newest first).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={userColumns}
                  data={users}
                  title="Participants"
                  searchKey="name"
                  disableAutoRotate={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Email Ticket Statistics
                  </CardTitle>
                  <CardDescription>
                    Track email ticket delivery status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <div className="text-2xl font-bold text-green-700">
                        {stats.ticketsSentUsers}
                      </div>
                      <div className="text-sm text-green-600">Tickets Sent</div>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-4 text-center">
                      <div className="text-2xl font-bold text-orange-700">
                        {stats.ticketsNotSentUsers}
                      </div>
                      <div className="text-sm text-orange-600">Pending</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Delivery Rate</span>
                    <Badge
                      variant={ticketSentRate > 70 ? "default" : "secondary"}
                    >
                      {ticketSentRate}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Manage email ticket operations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full" asChild>
                    <a href="/email-tickets">
                      <Ticket className="mr-2 h-4 w-4" />
                      Send Email Tickets
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    <Mail className="mr-2 h-4 w-4" />
                    View Email Templates
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Email Analytics
                  </Button>
                  <div className="text-muted-foreground pt-2 text-center text-xs">
                    Some features coming soon
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Participants by Ticket Status</CardTitle>
                <CardDescription>
                  View participants filtered by email ticket delivery status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={userColumns}
                  data={users}
                  title="All Participants"
                  searchKey="name"
                  disableAutoRotate={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Detailed insights and reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground py-8 text-center">
                  Analytics charts and detailed reports will be displayed here.
                  <br />
                  Feature coming soon!
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
