import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Calendar,
  Users,
  CheckSquare,
  Ticket,
  ArrowRight,
  Plus,
} from "lucide-react";
import { SignIn } from "~/components/SignIn";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { getAllEvents } from "~/server/queries";
import { Badge } from "~/components/ui/badge";

export const dynamic = "force-dynamic";

// Landing Page Component (shown when not logged in)
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight sm:text-7xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Stampede
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The complete event management platform. Create events, manage
              teams, track tasks, and engage with participants - all in one
              place.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignIn />
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Event Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create, organize, and manage events with detailed information
                and scheduling.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Work together with role-based teams and seamless collaboration
                tools.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CheckSquare className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Linear-style task boards to track progress and organize work
                efficiently.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Ticket className="h-12 w-12 mx-auto text-primary" />
              <CardTitle>Participant Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                QR codes, email tickets, and comprehensive attendance
                management.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Events Page Component (shown when logged in)
async function EventsPage() {
  const events = await getAllEvents();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Events</h1>
              <p className="text-muted-foreground">
                Manage and organize your events
              </p>
            </div>
            <Button asChild>
              <Link href="/events/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {events.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent className="space-y-4">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">No Events Yet</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Get started by creating your first event. You can manage
                  teams, tasks, and participants all in one place.
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link href="/events/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Event
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{event.name}</CardTitle>
                    <Badge variant={event.start_date ? "default" : "secondary"}>
                      {event.start_date ? "Scheduled" : "Draft"}
                    </Badge>
                  </div>
                  {event.description && (
                    <CardDescription className="line-clamp-2">
                      {event.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {event.start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(event.start_date).toLocaleDateString()}
                      </div>
                    )}
                    {event.address && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {event.address}
                      </div>
                    )}
                    {event.max_capacity && (
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        Max {event.max_capacity} participants
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/events/${event.id}/dashboard`}>
                        Open Event
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return <LandingPage />;
  }

  return <EventsPage />;
}
