import { Suspense } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { LinearTaskBoard } from "~/components/LinearTaskBoard";
import { CreateTaskModal } from "~/components/create-task-modal";
import {
  getEventById,
  getTasksByEvent,
  getTeamsByEvent,
} from "~/server/queries";

async function EventTasksContent({ eventId }: { eventId: string }) {
  const eventIdNum = parseInt(eventId);

  if (Number.isNaN(eventIdNum)) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground">Invalid event ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  try {
    const [event, tasks, teams] = await Promise.all([
      getEventById(eventIdNum),
      getTasksByEvent(eventIdNum),
      getTeamsByEvent(eventIdNum),
    ]);

    if (!event) {
      return (
        <div className="flex items-center justify-center py-20">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Event Not Found</h3>
              <p className="text-muted-foreground">
                The event you're looking for doesn't exist.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Get all team members for task assignment
    const teamMembers = teams.flatMap(
      (team) =>
        team.members?.map((member) => ({
          id: member.user_id,
          name: member.user?.name,
          email: member.user?.email || "",
        })) || []
    );

    if (tasks.length === 0) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
              <p className="text-muted-foreground">
                Manage tasks for {event.name}
              </p>
            </div>
          </div>
          <Card className="text-center py-12">
            <CardContent className="text-center">
              <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first task for {event.name} to get started with
                project management.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Tasks help you organize and track work for your event.
              </p>
              <CreateTaskModal
                eventId={eventIdNum}
                teamMembers={teamMembers}
              />
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground">
              Project management for {event.name}
            </p>
          </div>
          <CreateTaskModal
            eventId={eventIdNum}
            teamMembers={teamMembers}
          />
        </div>

        <LinearTaskBoard tasks={tasks} />
      </div>
    );
  } catch (error) {
    console.error("Failed to fetch data:", error);
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Error</h3>
            <p className="text-muted-foreground">Failed to load data</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}

function TasksLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`column-skeleton-${i}`} className="space-y-3">
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
            {Array.from({ length: 3 }, (_, j) => (
              <div
                key={`task-skeleton-${i}-${j}`}
                className="h-20 bg-muted animate-pulse rounded"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface TasksPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventTasksPage({ params }: TasksPageProps) {
  const { eventId } = await params;

  return (
    <Suspense fallback={<TasksLoadingSkeleton />}>
      <EventTasksContent eventId={eventId} />
    </Suspense>
  );
}
