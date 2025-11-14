import { auth } from "~/lib/auth";
import { notFound } from "next/navigation";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { EventSidebar } from "~/components/event-sidebar";
import { SignIn } from "~/components/SignIn";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { getEventById } from "~/server/queries";
import { headers } from "next/headers";

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const { eventId } = await params;

  if (!session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">Sign in required</h2>
          <p className="text-muted-foreground">
            Please sign in to access event management.
          </p>
          <SignIn />
        </div>
      </div>
    );
  }

  const eventIdNum = parseInt(eventId, 10);
  if (Number.isNaN(eventIdNum)) {
    notFound();
  }

  const event = await getEventById(eventIdNum);

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">
            Event not found
          </h1>
          <p className="text-muted-foreground">
            The event you're looking for doesn't exist or you don't have access
            to it.
          </p>
          <Button asChild>
            <Link href="/events">Back to Events</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider open={false}>
      <EventSidebar event={event} />
      <SidebarInset>
        <main className="flex flex-col gap-4 p-4 md:p-6">
          {" "}
          <SidebarTrigger />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
