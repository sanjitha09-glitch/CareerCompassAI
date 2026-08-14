import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { signOut, useCurrentUser } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — CareerCompass AI" },
      { name: "description", content: "Manage notifications, privacy and account preferences." },
      { property: "og:title", content: "Settings — CareerCompass AI" },
      { property: "og:description", content: "Control how CareerCompass AI works for you." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["user-settings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("user_settings").select("*").maybeSingle();
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Record<string, boolean>) => {
      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: user!.id, ...patch }, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Settings updated");
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggles: Array<{ key: string; label: string; description: string; value: boolean }> = [
    {
      key: "email_notifications",
      label: "Email notifications",
      description: "Career matches, roadmap nudges and weekly summaries.",
      value: data?.email_notifications ?? true,
    },
    {
      key: "push_notifications",
      label: "In-app notifications",
      description: "Live alerts inside the dashboard.",
      value: data?.push_notifications ?? true,
    },
    {
      key: "profile_public",
      label: "Public profile",
      description: "Let mentors discover your profile.",
      value: data?.profile_public ?? false,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Notifications, privacy and account controls." />

      <section className="glass-panel divide-y divide-border rounded-2xl">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-4 p-5">
            <div>
              <Label className="text-sm font-medium">{t.label}</Label>
              <p className="text-xs text-muted-foreground">{t.description}</p>
            </div>
            <Switch checked={t.value} onCheckedChange={(v) => update.mutate({ [t.key]: v })} />
          </div>
        ))}
      </section>

      <section className="glass-panel space-y-3 rounded-2xl p-5">
        <p className="font-display font-semibold">Account</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              if (!user?.email) return;
              const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              if (error) {
                toast.error(error.message);
                return;
              }
              toast.success("Password reset email sent");
            }}
          >
            Reset password
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await signOut();
              window.location.href = "/auth";
            }}
          >
            Log out
          </Button>
        </div>
      </section>
    </div>
  );
}
