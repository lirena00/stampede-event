"use client";

import { Button } from "~/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "~/hooks/use-toast";

interface CopyInviteCodeProps {
  inviteCode: string;
}

export function CopyInviteCode({ inviteCode }: CopyInviteCodeProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: "Copied!",
      description: "Invite code copied to clipboard",
    });
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy}>
      <Copy className="h-3 w-3" />
    </Button>
  );
}