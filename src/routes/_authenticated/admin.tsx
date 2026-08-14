import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, GraduationCap, ShieldAlert, Users } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { useRoles } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — CareerCompass AI" },
      { name: "description", content: "Platform overview: users, courses and internship listings." },
      { property: "og:title", content: "Admin Panel — CareerCompass AI" },
      { property: "og:description", content: "Manage the CareerCompass AI platform." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const isAdmin = (roles ?? []).includes("admin");

  const { data } = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [profiles, courses, internships] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("courses").select("id", { count: "exact", head: true }),
        supabase.from("internships").select("id", { count: "exact", head: true }),
      ]);
      return {
        users: profiles.count ?? 0,
        courses: courses.count ?? 0,
        internships: internships.count ?? 0,
      };
    },
  });

  if (!rolesLoading && !isAdmin) {
    return (
      <div className="glass-panel rounded-2xl p-10 text-center">
        <ShieldAlert className="mx-auto size-8 text-destructive" />
        <p className="mt-3 font-display text-lg font-semibold">Admins only</p>
        <p className="mt-1 text-sm text-muted-foreground">You don't have access to this area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Admin panel" description="Platform health and content overview." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Users" value={data?.users ?? 0} caption="Registered learners" icon={Users} />
        <StatCard index={1} label="Courses" value={data?.courses ?? 0} caption="In the catalog" icon={GraduationCap} tone="info" />
        <StatCard index={2} label="Internships" value={data?.internships ?? 0} caption="Live listings" icon={Briefcase} tone="success" />
      </div>
    </div>
  );
}
