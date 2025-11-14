import { Suspense } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Plus, Calendar, MapPin, Users, Clock } from "lucide-react";
import { getAllEvents } from "~/server/queries";
import ModernHeader from "~/components/ModernHeader";

export const dynamic = "force-dynamic";

async function EventsList() {
  const events = await getAllEvents();

  if (events.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first event to start managing attendees and tasks.
          </p>
          <Link href="/events/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Card key={event.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="line-clamp-1">{event.name}</CardTitle>
                <CardDescription className="line-clamp-2 mt-1">
                  {event.description || "No description provided"}
                </CardDescription>
              </div>
              <Badge variant={event.is_active ? "default" : "secondary"}>
                {event.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Details */}
            <div className="space-y-3">
              {event.address && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="line-clamp-1">{event.address}</span>
                </div>
              )}

              {event.start_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(event.start_date).toLocaleDateString()} at{" "}
                    {new Date(event.start_date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}

              {event.max_capacity && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Max capacity: {event.max_capacity} attendees</span>
                </div>
              )}
            </div>

            {/* Creator */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                Created by {event.createdBy?.name || "Unknown"}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(event.created_at!).toLocaleDateString()}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Link href={`/events/${event.id}/dashboard`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Dashboard
                </Button>
              </Link>
              <Link href={`/events/${event.id}/tasks`}>
                <Button size="sm">Manage</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventsListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={`skeleton-${i}`}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EventsPageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Events
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage your events, teams, and tasks all in one place.
        </p>
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <ModernHeader />
      <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <EventsPageHeader />

        {/* Events List */}
        <Suspense fallback={<EventsListSkeleton />}>
          <EventsList />
        </Suspense>
      </div>
    </main>
  );
}
