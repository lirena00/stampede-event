"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Calendar,
  BarChart3,
  Ticket,
  CheckSquare,
  Users,
  Upload,
  AlertTriangle,
  LogOut,
  ChevronUp,
  Home,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
  SidebarTrigger,
} from "~/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { signOut, useSession } from "~/lib/auth-client";

interface Event {
  id: number;
  name: string;
  description?: string | null;
  address?: string | null;
  start_date?: Date | null;
  end_date?: Date | null;
  max_capacity?: number | null;
  is_active: boolean | null;
}

interface TeamMember {
  id: number;
  userId: string;
  role: string;
  teamName: string;
}

interface EventSidebarProps {
  event: Event;
  teamMembers: TeamMember[];
}

export function EventSidebar({ event }: EventSidebarProps) {
  const params = useParams();
  const pathname = usePathname();
  const { data: session } = useSession();

  const eventId = params?.eventId as string;

  const navItems = [
    {
      title: "Dashboard",
      url: `/events/${eventId}/dashboard`,
      icon: BarChart3,
    },
    {
      title: "Tickets",
      url: `/events/${eventId}/tickets`,
      icon: Ticket,
    },
    {
      title: "Tasks",
      url: `/events/${eventId}/tasks`,
      icon: CheckSquare,
    },
    {
      title: "Teams",
      url: `/events/${eventId}/teams`,
      icon: Users,
    },
    {
      title: "Upload",
      url: `/events/${eventId}/upload`,
      icon: Upload,
    },
    {
      title: "Failed Webhooks",
      url: `/events/${eventId}/failed-webhooks`,
      icon: AlertTriangle,
    },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-2">
          <SidebarTrigger className="h-8 w-8" />
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Calendar className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{event.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                Event Management
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Event Info</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant={event.is_active ? "default" : "secondary"}
                  className="h-5 text-xs"
                >
                  {event.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              {event.max_capacity && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{event.max_capacity}</span>
                </div>
              )}
              {event.start_date && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Start</span>
                  <span className="font-medium text-xs">
                    {new Date(event.start_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={session?.user?.image || ""}
                      alt={session?.user?.name || ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.name || "User"}
                    </span>
                    <span className="truncate text-xs">
                      {session?.user?.email || ""}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/events">
                    <Home className="h-4 w-4" />
                    Back to Events
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
