import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Building2, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { generateCareerMatches } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/careers")({
  head: () => ({
    meta: [
      { title: "Career Recommendations — CareerCompass AI" },
      { name: "description", content: "AI-matched career paths with match scores, salary ranges, demand and skill gaps." },
      { property: "og:title", content: "Career Recommendations — CareerCompass AI" },
      { property: "og:description", content: "Discover the careers that fit your skills and interests." },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  const queryClient = useQueryClient();
  const generate = useServerFn(generateCareerMatches);

  const { data, isLoading } = useQuery({
    queryKey: ["career-matches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("career_matches")
        .select("*")
        .order("match_score", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const run = useMutation({
    mutationFn: async () => generate({ data: undefined as never }),
    onSuccess: () => {
      toast.success("Fresh career matches generated");
      queryClient.invalidateQueries({ queryKey: ["career-matches"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Career recommendations"
        description="Ranked by how well your profile, skills and assessments fit each path."
        actions={
          <Button onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
            Generate with AI
          </Button>
        }
      />

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && (data ?? []).length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <Sparkles className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-display text-lg font-semibold">No recommendations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your <Link to="/profile" className="text-primary underline">profile</Link>, then generate AI matches.
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((c, i) => (
          <motion.article
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="glass-panel hover-lift rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">{c.title}</h2>
                <p className="text-xs text-muted-foreground">{c.salary_range}</p>
              </div>
              <div className="text-right">
                <p className="gradient-text font-display text-2xl font-bold">{c.match_score}%</p>
                <p className="text-[10px] text-muted-foreground">{c.confidence}% confidence</p>
              </div>
            </div>

            <Progress value={c.match_score} className="mt-3 h-1.5" />
            <p className="mt-3 text-sm text-muted-foreground">{c.description}</p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {c.demand && (
                <Badge variant="secondary" className="gap-1">
                  <TrendingUp className="size-3" /> {c.demand} demand
                </Badge>
              )}
              {c.growth && <Badge variant="outline">{c.growth} growth</Badge>}
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills required</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.required_skills.slice(0, 8).map((s) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>
              {c.missing_skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills to build</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {c.missing_skills.slice(0, 8).map((s) => (
                      <Badge key={s} className="bg-warning/15 text-warning hover:bg-warning/20">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {c.companies.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="size-3.5" /> {c.companies.slice(0, 5).join(" · ")}
                </p>
              )}
            </div>

            <Button asChild variant="outline" className="mt-5 w-full">
              <Link to="/roadmap" search={{ target: c.title }}>
                Build roadmap for this path
              </Link>
            </Button>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
