/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { ResponsiveDialog } from "~/components/ui/responsive-dialog";
import {
  MoreHorizontal,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  User,
  Eye,
  Ticket,
  Calendar,
  Copy,
  Edit,
  UserCog,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import {
  updateUserStatus,
  updateParticipantAttendance,
  removeParticipant,
  updateParticipantStatus,
} from "~/server/actions";
import { useRouter } from "next/navigation";
import { Spinner } from "~/components/ui/spinner";

export type User = {
  id: number;
  name: string;
  status: string;
  attended: boolean | null;
  phone: string;
  email: string;
  ticket_sent: boolean | null;
  ticket_sent_at: Date | null;
  transaction_id: string;
  screenshot: string;
  created_at: Date | null;
};

const getStatusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "registered":
      return "default";
    case "confirmed":
      return "secondary";
    case "cancelled":
      return "destructive";
    default:
      return "outline";
  }
};

const getAttendanceIcon = (attended: boolean | null) => {
  return attended ? CheckCircle : XCircle;
};

const getAttendanceVariant = (attended: boolean | null) => {
  return attended ? "default" : "secondary";
};

const getTicketStatusVariant = (ticketSent: boolean | null) => {
  return ticketSent ? "default" : "outline";
};

const EditParticipantDialog = ({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [attended, setAttended] = useState(user.attended ?? false);
  const [status, setStatus] = useState(
    user.status === "registered" || user.status === "verified"
      ? user.status
      : "registered",
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update attendance if changed
      if (attended !== user.attended) {
        const attendanceResult = await updateParticipantAttendance(
          user.id,
          attended,
        );
        if (!attendanceResult.success) {
          toast.error(attendanceResult.message);
          setIsLoading(false);
          return;
        }
      }

      // Update status if changed
      if (status !== user.status) {
        const statusResult = await updateParticipantStatus(user.id, status);
        if (!statusResult.success) {
          toast.error(statusResult.message);
          setIsLoading(false);
          return;
        }
      }

      toast.success("Participant updated successfully");
      setIsOpen(false);
      router.refresh(); // Refresh the page data
      onUpdate(); // Call the callback if needed
    } catch (error) {
      toast.error("Failed to update participant");
      console.error("Error updating participant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit className="mr-2 h-4 w-4" />
          Edit participant
        </DropdownMenuItem>
      }
      title="Edit Participant"
      description={`Update information for ${user.name}`}
      footer={
        <div className="flex w-full gap-2">
          <Button onClick={handleSave} disabled={isLoading} className="flex-1">
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Basic Info Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <Avatar className="h-12 w-12">
              <AvatarFallback>
                {user.name
                  .split(" ")
                  .map((n) => n.charAt(0))
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center">
            <h3 className="font-semibold">{user.name}</h3>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>

        {/* Status Controls */}
        <div className="space-y-4">
          {/* Registration Status Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <div className="font-medium">Registration Status</div>
              <div className="text-muted-foreground text-sm">
                Click to toggle between registered and verified
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={status === "registered" ? "default" : "secondary"}
                className="hover:bg-primary/80 cursor-pointer text-xs capitalize"
                onClick={() => {
                  setStatus(
                    status === "registered" ? "verified" : "registered",
                  );
                }}
              >
                {status}
              </Badge>
            </div>
          </div>

          {/* Attendance Status Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <div className="font-medium">Attendance Status</div>
              <div className="text-muted-foreground text-sm">
                Click to toggle attendance status
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={attended ? "default" : "secondary"}
                className="hover:bg-primary/80 cursor-pointer gap-1 text-xs"
                onClick={() => setAttended(!attended)}
              >
                {attended ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {attended ? "Attended" : "Not Attended"}
              </Badge>
            </div>
          </div>

          {/* Status Information */}
          <div className="grid grid-cols-1 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Email Ticket</span>
              <Badge
                variant={getTicketStatusVariant(user.ticket_sent)}
                className="gap-1"
              >
                <Ticket className="h-3 w-3" />
                {user.ticket_sent ? "Sent" : "Not Sent"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
};

const UserDetailsDialog = ({ user }: { user: User }) => {
  const [isOpen, setIsOpen] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Eye className="mr-2 h-4 w-4" />
          View details
        </DropdownMenuItem>
      }
      title="Participant Details"
      description={`Complete information about ${user.name}`}
    >
      <div className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user.name
                  .split(" ")
                  .map((n) => n.charAt(0))
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant={getStatusVariant(user.status)} className="capitalize">
            {user.status}
          </Badge>
          <Badge
            variant={getAttendanceVariant(user.attended)}
            className="gap-1"
          >
            {user.attended ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {user.attended ? "Attended" : "Not Attended"}
          </Badge>
          <Badge
            variant={getTicketStatusVariant(user.ticket_sent)}
            className="gap-1"
          >
            <Ticket className="h-3 w-3" />
            {user.ticket_sent ? "Ticket Sent" : "No Ticket"}
          </Badge>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="font-medium">Contact Information</h4>
          <div className="space-y-2">
            <div className="bg-muted flex items-center justify-between rounded-md p-2">
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(user.email, "Email")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="bg-muted flex items-center justify-between rounded-md p-2">
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">{user.phone}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(user.phone, "Phone")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Registration Details */}
        <div className="space-y-3">
          <h4 className="font-medium">Registration Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID:</span>
              <span className="bg-muted rounded px-2 py-1 font-mono text-xs">
                {user.transaction_id || "N/A"}
              </span>
            </div>
            {user.ticket_sent_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket Sent:</span>
                <span className="text-xs">
                  {new Date(user.ticket_sent_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Screenshot Link */}
        {user.screenshot && (
          <div className="space-y-2">
            <h4 className="font-medium">Payment Screenshot</h4>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open(user.screenshot, "_blank")}
            >
              View Screenshot
            </Button>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
};

const RemoveParticipantDialog = ({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      const result = await removeParticipant(user.id);

      if (result.success) {
        toast.success(result.message);
        setIsOpen(false);
        router.refresh(); // Refresh the page data
        onUpdate(); // Call the callback if needed
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Failed to remove participant");
      console.error("Error removing participant:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-destructive focus:text-destructive"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Remove participant
        </DropdownMenuItem>
      }
      title="Remove Participant"
      description={`Are you sure you want to remove ${user.name}? This action cannot be undone.`}
      footer={
        <div className="flex w-full gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRemove}
            disabled={isLoading}
            variant="destructive"
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove"
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              {user.name
                .split(" ")
                .map((n) => n.charAt(0))
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="text-center">
          <h3 className="font-semibold">{user.name}</h3>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        <div className="bg-destructive/10 border-destructive/20 rounded-lg border p-4">
          <p className="text-destructive text-sm">
            <strong>Warning:</strong> This will permanently delete all
            participant data including registration details, attendance records,
            and ticket information. This action cannot be undone.
          </p>
        </div>
      </div>
    </ResponsiveDialog>
  );
};

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Participant",
    enableSorting: true,
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const email = row.original.email;
      const initials = name
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground text-xs">{email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant={getStatusVariant(status)} className="capitalize">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "attended",
    header: "Attendance",
    enableSorting: true,
    cell: ({ row }) => {
      const attendance = row.getValue("attended") as boolean | null;
      const Icon = getAttendanceIcon(attendance);
      const isPresent = attendance === true;

      return (
        <Badge variant={getAttendanceVariant(attendance)} className="gap-1">
          <Icon className="h-3 w-3" />
          {isPresent ? "Attended" : "Not Attended"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "ticket_sent",
    header: "Email Ticket",
    enableSorting: true,
    cell: ({ row }) => {
      const ticketSent = row.getValue("ticket_sent") as boolean | null;
      const ticketSentAt = row.original.ticket_sent_at;

      return (
        <div className="flex flex-col gap-1">
          <Badge variant={getTicketStatusVariant(ticketSent)} className="gap-1">
            <Ticket className="h-3 w-3" />
            {ticketSent ? "Sent" : "Not Sent"}
          </Badge>
          {ticketSent && ticketSentAt && (
            <span className="text-muted-foreground text-xs">
              {new Date(ticketSentAt).toLocaleDateString()}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Contact",
    enableSorting: false,
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      const email = row.original.email;

      return (
        <div className="flex flex-col gap-1 text-sm">
          <div className="text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span className="text-xs">{phone}</span>
          </div>
          <div className="text-muted-foreground flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span className="text-xs">{email}</span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Registration Date",
    enableSorting: true,
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at") as Date | null;

      if (!createdAt) {
        return <span className="text-muted-foreground text-sm">-</span>;
      }

      const date = new Date(createdAt);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60),
      );
      const diffInDays = Math.floor(diffInHours / 24);

      let timeAgo = "";
      if (diffInHours < 1) {
        timeAgo = "Just now";
      } else if (diffInHours < 24) {
        timeAgo = `${diffInHours}h ago`;
      } else if (diffInDays < 7) {
        timeAgo = `${diffInDays}d ago`;
      } else {
        timeAgo = date.toLocaleDateString();
      }

      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="text-muted-foreground h-3 w-3" />
            <span>{date.toLocaleDateString()}</span>
          </div>
          <span className="text-muted-foreground text-xs">{timeAgo}</span>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const router = useRouter();

      const handleRefresh = () => {
        router.refresh();
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.email)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy email
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(user.phone)}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy phone
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <UserDetailsDialog user={user} />
            <EditParticipantDialog user={user} onUpdate={handleRefresh} />
            <DropdownMenuSeparator />
            <RemoveParticipantDialog user={user} onUpdate={handleRefresh} />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
