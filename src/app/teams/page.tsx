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
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Skeleton } from "~/components/ui/skeleton";
import { Plus, Users, Crown, Shield, User } from "lucide-react";
import { getTeamsByEvent, getAllEvents } from "~/server/queries";
import Header from "~/components/Header";
import { CreateTeamInviteModal } from "~/components/create-team-invite-modal";
import { JoinTeamModal } from "~/components/join-team-modal";
import { CreateTeamModal } from "~/components/create-team-modal";

export const dynamic = "force-dynamic";

const roleIcons = {
  admin: Crown,
  moderator: Shield,
  member: User,
};

const roleColors = {
  admin: "bg-yellow-100 text-yellow-700 border-yellow-200",
  moderator: "bg-blue-100 text-blue-700 border-blue-200",
  member: "bg-gray-100 text-gray-700 border-gray-200",
};

async function TeamsContent() {
  // Get first event for demo - in real app you'd have event selection
  const events = await getAllEvents();
  const currentEvent = events[0];

  if (!currentEvent) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No events found</h3>
          <p className="text-muted-foreground mb-4">
            Create an event first to start building teams.
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

  const teams = await getTeamsByEvent(currentEvent.id);

  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              Teams for {currentEvent.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              No teams created yet. Start building your event team.
            </p>
          </div>
          <div className="flex gap-2">
            <JoinTeamModal />
            <CreateTeamModal eventId={currentEvent.id} />
          </div>
        </div>

        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first team to start collaborating on event management.
            </p>
            <CreateTeamModal eventId={currentEvent.id} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Teams for {currentEvent.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {teams.length} team{teams.length !== 1 ? "s" : ""} managing this
            event
          </p>
        </div>
        <div className="flex gap-2">
          <JoinTeamModal />
          <CreateTeamModal eventId={currentEvent.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="line-clamp-1">{team.name}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {team.description || "No description provided"}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  {team.members.length} member
                  {team.members.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Members */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Members</h4>
                <div className="space-y-2">
                  {team.members.slice(0, 3).map((member) => {
                    const RoleIcon =
                      roleIcons[member.role as keyof typeof roleIcons] || User;
                    const roleColor =
                      roleColors[member.role as keyof typeof roleColors] ||
                      roleColors.member;

                    return (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {member.user?.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("") || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {member.user?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.user?.email}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${roleColor}`}
                        >
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {member.role}
                        </Badge>
                      </div>
                    );
                  })}

                  {team.members.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center pt-2">
                      +{team.members.length - 3} more member
                      {team.members.length - 3 !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Stats */}
              <div className="flex items-center justify-between pt-2 border-t text-sm text-muted-foreground">
                <span>
                  Created{" "}
                  {team.created_at
                    ? new Date(team.created_at).toLocaleDateString()
                    : "Unknown"}
                </span>
                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  {team.members.filter((m) => m.role === "admin").length} admin
                  {team.members.filter((m) => m.role === "admin").length !== 1
                    ? "s"
                    : ""}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <CreateTeamInviteModal
                  teamId={team.id}
                  eventId={currentEvent.id}
                  teamName={team.name}
                />
                <Button variant="outline" className="flex-1" size="sm">
                  View Details
                </Button>
                <Button size="sm">Manage</Button>
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
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Card key={`skeleton-team-${Math.random()}-${i}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-16" />
                {[...Array(3)].map((_, j) => (
                  <div
                    key={`skeleton-member-${Math.random()}-${j}`}
                    className="flex items-center gap-3"
                  >
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function TeamsPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Header />

        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Teams
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Manage your event teams, roles, and permissions.
          </p>
        </div>

        <Suspense fallback={<TeamsLoadingSkeleton />}>
          <TeamsContent />
        </Suspense>
      </div>
    </main>
  );
}
