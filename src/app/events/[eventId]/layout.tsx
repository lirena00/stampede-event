"use client";

import { useSession } from "~/lib/auth-client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarProvider } from "~/components/ui/sidebar";
import { EventSidebar } from "~/components/event-sidebar";
import { SignIn } from "~/components/SignIn";

interface Event {
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  start_date?: Date | null;
  end_date?: Date | null;
  max_capacity?: number | null;
  is_active: boolean | null;
}

interface TeamMember {
  id: number;
  userId: string;
  role: string;
  teamName: string;
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const eventId = params?.eventId as string;

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId || !session?.user) return;

      try {
        setLoading(true);
        setError(null);

        const eventIdNum = parseInt(eventId);
        if (Number.isNaN(eventIdNum)) {
          setError("Invalid event ID");
          return;
        }

        // Fetch data from API routes
        const [eventResponse, teamsResponse] = await Promise.all([
          fetch(`/api/events/${eventIdNum}`),
          fetch(`/api/events/${eventIdNum}/teams`),
        ]);

        if (!eventResponse.ok) {
          if (eventResponse.status === 404) {
            setError("Event not found");
          } else {
            setError("Failed to load event");
          }
          return;
        }

        const eventData = await eventResponse.json();
        const teamsData = teamsResponse.ok ? await teamsResponse.json() : [];

        if (!eventData) {
          setError("Event not found");
          return;
        }

        setEvent(eventData);

        // Convert teams data to team members format
        const members: TeamMember[] = teamsData.flatMap(
          (team: {
            members: {
              id: string;
              userId: string;
              role: string;
              user: { id: string; name?: string | null };
            }[];
            name: string;
            id: string;
          }) =>
            team.members.map((member) => ({
              id: member.id,
              userId: member.userId,
              role: member.role,
              teamName: team.name,
            }))
        );
        setTeamMembers(members);
      } catch (err) {
        console.error("Failed to fetch event data:", err);
        setError("Failed to load event data");
      } finally {
        setLoading(false);
      }
    };

    void fetchEventData();
  }, [eventId, session?.user]);

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Sign in required</h2>
          <p className="text-muted-foreground">
            Please sign in to access event management.
          </p>
          <SignIn />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            {error || "Event not found"}
          </h1>
          <p className="text-muted-foreground">
            The event you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <a
            href="/events"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Back to Events
          </a>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <EventSidebar event={event} teamMembers={teamMembers} />
        <main className="flex-1 overflow-hidden">
          <div className="h-full p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
