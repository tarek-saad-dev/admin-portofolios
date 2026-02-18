"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Settings,
  Home,
  ChevronLeft,
  Menu,
  X,
  Network
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/os",
    icon: LayoutDashboard,
    description: "Overview and today's tasks"
  },
  {
    name: "Tasks",
    href: "/admin/os/tasks",
    icon: CheckSquare,
    description: "All tasks with board and table views"
  },
  {
    name: "Weekly Planner",
    href: "/admin/os/planner",
    icon: Calendar,
    description: "Plan your week ahead"
  },
  {
    name: "Canvas",
    href: "/admin/os/canvas",
    icon: Network,
    description: "Brain-dump to structured tasks"
  },
  {
    name: "Analytics",
    href: "/admin/os/analytics",
    icon: BarChart3,
    description: "Progress tracking and insights"
  },
  {
    name: "Settings",
    href: "/admin/os/settings",
    icon: Settings,
    description: "Manage departments and tracks"
  },
];

export default function TaskOsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Tarek OS</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Multi-Department Task System
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mt-0.5 flex-shrink-0",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-medium text-sm",
                  isActive ? "text-primary-foreground" : ""
                )}>
                  {item.name}
                </div>
                <div className={cn(
                  "text-xs mt-0.5 line-clamp-1",
                  isActive
                    ? "text-primary-foreground/80"
                    : "text-muted-foreground group-hover:text-foreground/70"
                )}>
                  {item.description}
                </div>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button asChild variant="outline" className="w-full justify-start" size="sm">
          <Link href="/" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            <Home className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 border-r bg-card flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Tarek OS</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-card z-50 flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-16">
        {children}
      </main>
    </div>
  );
}
