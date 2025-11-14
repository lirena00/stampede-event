"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { UserCheck2, Loader2 } from "lucide-react";
import { joinTeamWithInvite } from "~/server/actions";
import { toast } from "~/hooks/use-toast";
import { useSession } from "~/lib/auth-client";

interface JoinTeamModalProps {
  onJoinSuccess?: () => void;
}

export function JoinTeamModal({ onJoinSuccess }: JoinTeamModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const { data: session } = useSession();

  const handleJoin = async () => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be signed in to join a team",
        variant: "destructive",
      });
      return;
    }

    if (!inviteCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter an invite code",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const result = await joinTeamWithInvite(
        inviteCode.trim(),
        session.user.id
      );

      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully joined team: ${result.team?.name || "Unknown"}`,
        });
        setInviteCode("");
        setOpen(false);
        onJoinSuccess?.();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to join team",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining team:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setInviteCode("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserCheck2 className="h-4 w-4 mr-2" />
          Join Team
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Join Team</DialogTitle>
          <DialogDescription>
            Enter an invite code to join a team
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="Enter invite code..."
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={loading || !inviteCode.trim()}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Join Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
