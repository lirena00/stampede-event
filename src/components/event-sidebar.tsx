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

interface EventSidebarProps {
  event: Event;
}

const NAV_ITEMS = [
  { title: "Dashboard", path: "dashboard", icon: BarChart3 },
  { title: "Tickets", path: "tickets", icon: Ticket },
  { title: "Tasks", path: "tasks", icon: CheckSquare },
  { title: "Teams", path: "teams", icon: Users },
  { title: "Upload", path: "upload", icon: Upload },
  { title: "Failed Webhooks", path: "failed-webhooks", icon: AlertTriangle },
] as const;

export function EventSidebar({ event }: EventSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={`/events/${event.id}/dashboard`}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                  <img
                    src="/logo.png"
                    alt="Stampede Logo"
                    className="size-6 object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{event.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Event Management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const url = `/events/${event.id}/${item.path}`;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={pathname === url}>
                      <Link href={url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Event Info</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="space-y-1 px-2 py-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={event.is_active ? "default" : "secondary"}>
                  {event.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              {event.max_capacity && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Capacity</span>
                  <span className="font-medium">{event.max_capacity}</span>
                </div>
              )}

              {event.start_date && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Start Date</span>
                  <span className="font-medium">
                    {new Date(event.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
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
                      src={session?.user?.image ?? undefined}
                      alt={session?.user?.name ?? "User"}
                    />
                    <AvatarFallback className="rounded-lg">
                      {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {session?.user?.name ?? "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session?.user?.email ?? ""}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/events" className="cursor-pointer">
                    <Home />
                    Back to Events
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut />
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
