"use client";

import { useRouter } from "next/navigation";
import { CreateTeamModal } from "./create-team-modal";
import { CreateTeamInviteModal } from "./create-team-invite-modal";
import { JoinTeamModal } from "./join-team-modal";
import { Button } from "./ui/button";
import { UserPlus } from "lucide-react";

interface ClientTeamModalsProps {
  eventId: number;
  canCreateTeam: boolean;
}

export function ClientTeamModals({ eventId, canCreateTeam }: ClientTeamModalsProps) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <JoinTeamModal onJoinSuccess={handleRefresh} />
      {canCreateTeam && (
        <CreateTeamModal eventId={eventId} onTeamCreated={handleRefresh} />
      )}
    </div>
  );
}

interface ClientInviteModalProps {
  teamId: number;
  eventId: number;
  teamName: string;
}

export function ClientInviteModal({ teamId, eventId, teamName }: ClientInviteModalProps) {
  const router = useRouter();

  return (
    <CreateTeamInviteModal
      teamId={teamId}
      eventId={eventId}
      teamName={teamName}
      onInviteCreated={() => router.refresh()}
      trigger={
        <Button variant="outline" size="sm">
          <UserPlus className="h-3 w-3" />
        </Button>
      }
    />
  );
}