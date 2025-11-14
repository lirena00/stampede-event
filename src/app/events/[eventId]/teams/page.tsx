import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Users, UserPlus, Crown, Shield } from "lucide-react";
import { getEventById, getTeamsByEvent } from "~/server/queries";
import { CreateTeamModal } from "~/components/create-team-modal";

export const dynamic = "force-dynamic";

async function EventTeamsContent({ eventId }: { eventId: string }) {
  const eventIdNum = parseInt(eventId);

  if (Number.isNaN(eventIdNum)) {
    notFound();
  }

  const [event, teams] = await Promise.all([
    getEventById(eventIdNum),
    getTeamsByEvent(eventIdNum),
  ]);

  if (!event) {
    notFound();
  }

  if (teams.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardHeader>
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>No Teams Yet</CardTitle>
          <CardDescription>
            Create your first team for {event.name} to start collaborating.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTeamModal eventId={eventIdNum} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Team collaboration for {event.name}
          </p>
        </div>
        <CreateTeamModal eventId={eventIdNum} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                  {team.description && (
                    <CardDescription className="text-sm">
                      {team.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {team.members?.length || 0} members
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Members */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Members</div>
                {team.members && team.members.length > 0 ? (
                  <div className="space-y-2">
                    {team.members.slice(0, 3).map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center gap-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-xs">
                            {member.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {member.user?.name || "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {member.user?.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {member.role === "admin" && (
                            <Crown className="h-3 w-3 text-yellow-600" />
                          )}
                          {member.role === "moderator" && (
                            <Shield className="h-3 w-3 text-blue-600" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {team.members.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{team.members.length - 3} more members
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No members yet
                  </div>
                )}
              </div>

              {/* Team Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  View Team
                </Button>
                <Button variant="outline" size="sm">
                  <UserPlus className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TeamsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-32 bg-muted animate-pulse rounded" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={`skeleton-${i}`} className="space-y-3">
            <div className="h-32 bg-muted animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface TeamsPageProps {
  params: Promise<{
    eventId: string;
  }>;
}

export default async function EventTeamsPage({ params }: TeamsPageProps) {
  const { eventId } = await params;

  return (
    <Suspense fallback={<TeamsLoadingSkeleton />}>
      <EventTeamsContent eventId={eventId} />
    </Suspense>
  );
}
