import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { signOut, useCurrentUser, useProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type SearchHit = { label: string; group: string; to: string };

const staticHits: SearchHit[] = [
  { label: "Dashboard", group: "Pages", to: "/dashboard" },
  { label: "Career Recommendation", group: "Pages", to: "/careers" },
  { label: "Skill Assessment", group: "Pages", to: "/assessment" },
  { label: "Roadmap", group: "Pages", to: "/roadmap" },
  { label: "Courses", group: "Pages", to: "/courses" },
  { label: "Internships", group: "Pages", to: "/internships" },
  { label: "Resume Analyzer", group: "Pages", to: "/resume" },
  { label: "Mock Interview", group: "Pages", to: "/interview" },
  { label: "AI Career Chatbot", group: "Pages", to: "/chatbot" },
  { label: "Progress Tracker", group: "Pages", to: "/progress" },
  { label: "Certificates", group: "Pages", to: "/certificates" },
  { label: "Settings", group: "Pages", to: "/settings" },
];

export function AppTopbar() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: catalog } = useQuery({
    queryKey: ["global-search-catalog"],
    queryFn: async () => {
      const [courses, internships, careers] = await Promise.all([
        supabase.from("courses").select("title").limit(40),
        supabase.from("internships").select("role, company").limit(40),
        supabase.from("career_paths").select("title").limit(40),
      ]);
      const hits: SearchHit[] = [
        ...(courses.data ?? []).map((c) => ({ label: c.title, group: "Courses", to: "/courses" })),
        ...(internships.data ?? []).map((i) => ({
          label: `${i.role} · ${i.company}`,
          group: "Internships",
          to: "/internships",
        })),
        ...(careers.data ?? []).map((c) => ({ label: c.title, group: "Careers", to: "/careers" })),
      ];
      return hits;
    },
    staleTime: 5 * 60_000,
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(15);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("notifications-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const unread = (notifications ?? []).filter((n) => !n.read).length;
  const initials = (profile?.full_name ?? user?.email ?? "U").slice(0, 2).toUpperCase();

  const hits = [...staticHits, ...(catalog ?? [])];
  const groups = Array.from(new Set(hits.map((h) => h.group)));

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-3 backdrop-blur-xl sm:px-6">
      <SidebarTrigger />

      <button
        onClick={() => setOpen(true)}
        className="hover-lift flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-card/60 px-3 text-sm text-muted-foreground sm:max-w-md"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search skills, careers, courses…</span>
        <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => {
            const next = !dark;
            setDark(next);
            document.documentElement.classList.toggle("dark", next);
          }}
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await supabase.from("notifications").update({ read: true }).eq("read", false);
                    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
                  }}
                >
                  <Check className="mr-1 size-3" /> Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {(notifications ?? []).length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  You're all caught up.
                </p>
              )}
              {(notifications ?? []).map((n) => (
                <div key={n.id} className="border-b border-border/60 px-4 py-3 last:border-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.read && <Badge variant="secondary">new</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-accent/10">
              <Avatar className="size-8">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Profile photo" />}
                <AvatarFallback className="bg-primary/15 text-xs text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left sm:block">
                <span className="block max-w-[9rem] truncate text-xs font-semibold">
                  {profile?.full_name ?? user?.email}
                </span>
                <span className="block text-[10px] text-muted-foreground">Student</span>
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                window.location.href = "/auth";
              }}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search careers, courses, internships, pages…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {groups.map((group) => (
            <CommandGroup key={group} heading={group}>
              {hits
                .filter((h) => h.group === group)
                .slice(0, 12)
                .map((hit, i) => (
                  <CommandItem
                    key={`${hit.label}-${i}`}
                    value={hit.label}
                    onSelect={() => {
                      setOpen(false);
                      navigate({ to: hit.to });
                    }}
                  >
                    {hit.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </header>
  );
}
