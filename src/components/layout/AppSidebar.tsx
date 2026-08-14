import { Link, useRouterState } from "@tanstack/react-router";
import {
  Award,
  Bot,
  Briefcase,
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LogOut,
  Map,
  Mic,
  Settings,
  Shield,
  User,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut, useRoles } from "@/hooks/useAuth";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Career Recommendation", url: "/careers", icon: Compass },
  { title: "Skill Assessment", url: "/assessment", icon: ListChecks },
  { title: "Roadmap", url: "/roadmap", icon: Map },
  { title: "Courses", url: "/courses", icon: GraduationCap },
  { title: "Internships", url: "/internships", icon: Briefcase },
] as const;

const aiItems = [
  { title: "Resume Analyzer", url: "/resume", icon: FileText },
  { title: "Mock Interview", url: "/interview", icon: Mic },
  { title: "AI Career Chatbot", url: "/chatbot", icon: Bot },
] as const;

const trackItems = [
  { title: "Progress Tracker", url: "/progress", icon: LineChart },
  { title: "Certificates", url: "/certificates", icon: Award },
  { title: "Settings", url: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: roles } = useRoles();
  const isAdmin = (roles ?? []).includes("admin");

  const renderGroup = (
    label: string,
    items: ReadonlyArray<{ title: string; url: string; icon: typeof User }>,
  ) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-3">
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3 px-1 py-2">
          <span className="gradient-brand grid size-9 shrink-0 place-items-center rounded-xl shadow-glow">
            <Compass className="size-5 text-primary-foreground" />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-bold">CareerCompass AI</span>
              <span className="block truncate text-xs text-muted-foreground">Your AI career mentor</span>
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {renderGroup("Explore", mainItems)}
        {renderGroup("AI Studio", aiItems)}
        {renderGroup("Track", trackItems)}
        {isAdmin &&
          renderGroup("Admin", [{ title: "Admin Panel", url: "/admin", icon: Shield }] as const)}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={() => {
                void signOut().then(() => {
                  window.location.href = "/auth";
                });
              }}
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
