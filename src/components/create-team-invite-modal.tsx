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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { UserPlus, Loader2, Copy, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTeamInvite } from "~/server/actions";
import { toast } from "~/hooks/use-toast";
import { useSession } from "~/lib/auth-client";

const createInviteSchema = z.object({
  role: z.enum(["admin", "moderator"]),
  usesLimit: z.number().optional(),
  expiresInDays: z.number().min(1).max(30),
});

type CreateInviteForm = z.infer<typeof createInviteSchema>;

interface CreateTeamInviteModalProps {
  teamId: number;
  eventId: number;
  teamName: string;
  onInviteCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateTeamInviteModal({
  teamId,
  eventId,
  teamName,
  onInviteCreated,
  trigger,
}: CreateTeamInviteModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedInvite, setGeneratedInvite] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: session } = useSession();

  const form = useForm<CreateInviteForm>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: {
      role: "moderator",
      expiresInDays: 7,
    },
  });

  const onSubmit = async (values: CreateInviteForm) => {
    if (!session?.user) {
      toast({
        title: "Error",
        description: "You must be signed in to create invites",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("teamId", teamId.toString());
      formData.append("eventId", eventId.toString());
      formData.append("role", values.role);
      formData.append("permissions", "{}");
      if (values.usesLimit) {
        formData.append("usesLimit", values.usesLimit.toString());
      }
      formData.append("expiresInDays", values.expiresInDays.toString());

      const result = await createTeamInvite(formData, session.user.id);

      if (result.success && result.invite) {
        setGeneratedInvite(result.invite.invite_code);
        toast({
          title: "Success",
          description: "Team invite created successfully",
        });
        onInviteCreated?.();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create invite",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating invite:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (generatedInvite) {
      await navigator.clipboard.writeText(generatedInvite);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Invite code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setGeneratedInvite(null);
    setCopied(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Create Invite
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Team Invite</DialogTitle>
          <DialogDescription>
            Generate an invite code for people to join {teamName}
          </DialogDescription>
        </DialogHeader>

        {generatedInvite ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Invite Code</p>
                  <p className="text-lg font-mono">{generatedInvite}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyInviteCode}
                  className="ml-2"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this invite code with people you want to invite to the team.
              They can use it to join automatically.
            </p>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Role that invited members will receive
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="usesLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usage Limit (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Unlimited"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of people who can use this invite
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresInDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires In (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      How many days until this invite expires
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Invite
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
