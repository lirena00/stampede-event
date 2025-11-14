"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Button } from "~/components/ui/button";
import { ModeToggle } from "~/components/mode-toggle";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import {
  Menu,
  Home,
  Upload,
  QrCode,
  Mail,
  Calendar,
  Users,
  Settings,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { SignIn } from "~/components/SignIn";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    description: "Overview and statistics",
  },
  {
    name: "Upload",
    href: "/upload",
    icon: Upload,
    description: "Add participants",
  },
  {
    name: "Attendance",
    href: "/attendance",
    icon: QrCode,
    description: "QR scanning",
  },
  {
    name: "Email Tickets",
    href: "/email-tickets",
    icon: Mail,
    description: "Send event tickets",
  },
  {
    name: "Failed Webhooks",
    href: "/failed-webhooks",
    icon: AlertTriangle,
    description: "Webhook failures",
  },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="border-border bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full rounded-lg border px-4 backdrop-blur">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        {/* Logo */}
        <div className="mr-6 flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center">
              <Image
                src="/logo.png"
                alt="Stampede Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-lg leading-tight font-bold">Stampede</span>
              <span className="text-muted-foreground text-xs">
                Event Management
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <NavigationMenuItem key={item.name}>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      navigationMenuTriggerStyle(),
                      "h-9 gap-2",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Link href={item.href}>
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{item.name}</span>
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side Actions */}
        <div className="ml-auto flex items-center space-x-2">
          {/* Theme Toggle */}
          <ModeToggle />
          <SignIn />

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-4">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center">
                      <Image
                        src="/logo.png"
                        alt="Stampede Logo"
                        width={32}
                        height={32}
                        className="rounded-lg"
                      />
                    </div>
                    Stampede
                  </SheetTitle>
                  <SheetDescription>Event Management System</SheetDescription>
                </SheetHeader>

                <Separator />

                <nav className="flex flex-col space-y-3">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {item.description}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  <SignIn />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
