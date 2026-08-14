import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Award, Clock, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress Tracker — CareerCompass AI" },
      { name: "description", content: "Track assessment scores, learning hours and roadmap completion over time." },
      { property: "og:title", content: "Progress Tracker — CareerCompass AI" },
      { property: "og:description", content: "See your growth week over week." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
  const { data } = useQuery({
    queryKey: ["progress"],
    queryFn: async () => {
      const [results, logs, roadmap] = await Promise.all([
        supabase.from("assessment_results").select("*").order("created_at"),
        supabase.from("activity_logs").select("*").order("created_at"),
        supabase.from("roadmap_steps").select("status"),
      ]);
      return {
        results: results.data ?? [],
        logs: logs.data ?? [],
        roadmap: roadmap.data ?? [],
      };
    },
  });

  const results = data?.results ?? [];
  const minutes = (data?.logs ?? []).reduce((acc, l) => acc + (l.minutes ?? 0), 0);
  const avg = results.length ? Math.round(results.reduce((a, r) => a + r.score, 0) / results.length) : 0;
  const roadmap = data?.roadmap ?? [];
  const completion = roadmap.length
    ? Math.round((roadmap.filter((r) => r.status === "completed").length / roadmap.length) * 100)
    : 0;

  const chart = results.map((r) => ({
    date: new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: r.score,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Progress tracker" description="Your learning momentum at a glance." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Average score" value={avg} suffix="%" caption={`${results.length} assessments taken`} progress={avg} icon={Target} />
        <StatCard index={1} label="Learning time" value={Math.round(minutes / 60)} suffix="h" caption="Tracked across activities" icon={Clock} tone="info" />
        <StatCard index={2} label="Roadmap completion" value={completion} suffix="%" caption="Steps completed" progress={completion} icon={Award} tone="success" />
      </div>

      <section className="glass-panel rounded-2xl p-5">
        <h2 className="font-display text-lg font-semibold">Score trend</h2>
        <div className="mt-4 h-72">
          {chart.length === 0 ? (
            <p className="text-sm text-muted-foreground">Take an assessment to start your trend line.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                <YAxis domain={[0, 100]} fontSize={12} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
