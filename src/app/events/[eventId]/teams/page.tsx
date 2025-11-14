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
import { Users, Crown, Shield, Settings, Calendar, Hash, AlertCircle } from "lucide-react";
import {
  getEventById,
  getTeamsByEvent,
  getUserTeamRole,
  getTeamInvitesByEvent,
} from "~/server/queries";

import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { Separator } from "~/components/ui/separator";
import { CopyInviteCode } from "~/components/copy-invite-code";
import { ClientTeamModals, ClientInviteModal } from "~/components/client-team-modals";

export const dynamic = "force-dynamic";

async function EventTeamsContent({ eventId }: { eventId: string }) {
  const eventIdNum = parseInt(eventId);

  if (Number.isNaN(eventIdNum)) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    notFound();
  }

  const [event, teams, userRole, teamInvites] = await Promise.all([
    getEventById(eventIdNum),
    getTeamsByEvent(eventIdNum),
    getUserTeamRole(session.user.id, eventIdNum),
    getTeamInvitesByEvent(eventIdNum).catch((error) => {
      console.error("Failed to fetch team invites, continuing without them:", error);
      return [];
    }),
  ]);

  if (!event) {
    notFound();
  }

  const canCreateTeam = userRole === "admin" || teams.length === 0;

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
          <ClientTeamModals eventId={eventIdNum} canCreateTeam={true} />
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
        <ClientTeamModals eventId={eventIdNum} canCreateTeam={canCreateTeam} />
      </div>

      {/* Active Invite Codes Section */}
      {teamInvites && teamInvites.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Active Invite Codes
            </CardTitle>
            <CardDescription>
              Share these codes with people you want to invite to your teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {teamInvites.map((invite) => (
                <div key={invite.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={invite.role === 'admin' ? 'default' : 'secondary'}>
                      {invite.role}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {invite.team?.name}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-muted px-2 py-1 rounded truncate">
                      {invite.invite_code}
                    </code>
                    <CopyInviteCode inviteCode={invite.invite_code} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {invite.used_count || 0}{invite.uses_limit ? `/${invite.uses_limit}` : ''} used
                    </span>
                    {invite.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((team) => {
          const teamInviteCount = teamInvites?.filter(inv => inv.team_id === team.id && inv.is_active).length || 0;
          
          return (
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
                  <div className="flex flex-col gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {team.members?.length || 0} members
                    </Badge>
                    {teamInviteCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {teamInviteCount} active invites
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Team Members */}
                <div className="space-y-3">
                  <div className="text-sm font-medium flex items-center gap-2">
                    Members
                    {(!team.members || team.members.length === 0) && (
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                    )}
                  </div>
                  {team.members && team.members.length > 0 ? (
                    <div className="space-y-2">
                      {team.members.slice(0, 4).map((member) => (
                        <div
                          key={member.user_id}
                          className="flex items-center gap-2"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="" alt={member.user?.name || member.user?.email} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                              {member.user?.name?.charAt(0)?.toUpperCase() || member.user?.email?.charAt(0)?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {member.user?.name || member.user?.email?.split('@')[0] || "Unknown User"}
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
                      {team.members.length > 4 && (
                        <div className="text-xs text-muted-foreground pl-8">
                          +{team.members.length - 4} more members
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-lg text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                      <div>No members yet</div>
                      <div className="text-xs mt-1">Create an invite to add members</div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Team Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Manage
                  </Button>
                  <ClientInviteModal 
                    teamId={team.id}
                    eventId={eventIdNum}
                    teamName={team.name}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
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
        {Array.from({ length: 6 }, (_, i) => (
          <div key={`skeleton-team-${i + 1}`} className="space-y-3">
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
