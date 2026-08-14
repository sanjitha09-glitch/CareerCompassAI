import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Award, ExternalLink } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates — CareerCompass AI" },
      { name: "description", content: "All the certificates you've earned, in one verified place." },
      { property: "og:title", content: "Certificates — CareerCompass AI" },
      { property: "og:description", content: "Showcase your achievements to recruiters." },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  const { data } = useQuery({
    queryKey: ["certificates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("certificates")
        .select("*")
        .order("issue_date", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Certificates" description="Your verified achievements and credentials." />

      {(data ?? []).length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <Award className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-display text-lg font-semibold">No certificates yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete courses and assessments to earn your first credential.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(data ?? []).map((c) => (
          <article key={c.id} className="glass-panel hover-lift rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2">
              <Award className="size-6 text-primary" />
              <Badge variant="secondary">{c.category}</Badge>
            </div>
            <h2 className="mt-3 font-display font-semibold">{c.title}</h2>
            <p className="text-xs text-muted-foreground">
              {c.issuer}
              {c.issue_date ? ` · ${new Date(c.issue_date).toLocaleDateString()}` : ""}
            </p>
            {c.credential_url && (
              <Button asChild size="sm" variant="outline" className="mt-4">
                <a href={c.credential_url} target="_blank" rel="noopener noreferrer">
                  View credential <ExternalLink className="ml-1 size-3.5" />
                </a>
              </Button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
