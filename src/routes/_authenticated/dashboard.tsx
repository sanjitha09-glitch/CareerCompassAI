import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Bot,
  Briefcase,
  FileText,
  GraduationCap,
  Mic,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AnimatedCounter } from "@/components/common/AnimatedCounter";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CareerCompass AI" },
      { name: "description", content: "Your career match score, skill gaps, roadmap progress and AI recommendations." },
      { property: "og:title", content: "Dashboard — CareerCompass AI" },
      { property: "og:description", content: "Track your career readiness in one premium AI workspace." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const [matches, skills, roadmap, courses, internships, resume, results] = await Promise.all([
        supabase.from("career_matches").select("*").order("match_score", { ascending: false }).limit(3),
        supabase.from("user_skills").select("*"),
        supabase.from("roadmap_steps").select("*").order("step_order"),
        supabase.from("courses").select("*").limit(4),
        supabase.from("internships").select("*").limit(4),
        supabase.from("resume_scores").select("*").order("created_at", { ascending: false }).limit(1),
        supabase.from("assessment_results").select("*").order("created_at", { ascending: false }).limit(6),
      ]);
      return {
        matches: matches.data ?? [],
        skills: skills.data ?? [],
        roadmap: roadmap.data ?? [],
        courses: courses.data ?? [],
        internships: internships.data ?? [],
        resume: resume.data?.[0] ?? null,
        results: results.data ?? [],
      };
    },
  });

  const skills = data?.skills ?? [];
  const have = skills.filter((s) => s.status === "have").length;
  const improve = skills.filter((s) => s.status !== "have").length;
  const roadmap = data?.roadmap ?? [];
  const done = roadmap.filter((s) => s.status === "completed").length;
  const roadmapProgress = roadmap.length ? Math.round((done / roadmap.length) * 100) : 0;
  const topMatch = data?.matches?.[0]?.match_score ?? 0;
  const resumeScore = data?.resume?.ats_score ?? 0;

  const gapData = [
    { name: "Skills you have", value: have || 1, color: "oklch(0.72 0.16 168)" },
    { name: "Skills to improve", value: improve || 1, color: "oklch(0.78 0.15 82)" },
  ];

  const progressData = (data?.results ?? [])
    .slice()
    .reverse()
    .map((r) => ({ name: r.category.slice(0, 8), score: r.score }));

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋`}
        description="Here's your AI-generated career snapshot for today."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/assessment">
                <Zap className="mr-2 size-4" /> Take assessment
              </Link>
            </Button>
            <Button asChild>
              <Link to="/careers">
                <Sparkles className="mr-2 size-4" /> Generate matches
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard index={0} label="Career Match Score" value={topMatch} suffix="%" caption="Top AI-matched career fit" progress={topMatch} icon={Target} tone="primary" />
        <StatCard index={1} label="Skills You Have" value={have} caption="Verified through assessments" icon={Award} tone="success" />
        <StatCard index={2} label="Skills to Improve" value={improve} caption="Gaps blocking your target role" icon={TrendingUp} tone="warning" />
        <StatCard index={3} label="Roadmap Progress" value={roadmapProgress} suffix="%" caption={`${done}/${roadmap.length || 0} steps completed`} progress={roadmapProgress} icon={GraduationCap} tone="info" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="glass-panel rounded-2xl p-5 xl:col-span-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Top Career Recommendations</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/careers">
                View all <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {(data?.matches ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground md:col-span-3">
                No recommendations yet — complete your profile and generate AI matches.
              </p>
            )}
            {(data?.matches ?? []).map((m, i) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="hover-lift rounded-xl border border-border bg-card/60 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{m.title}</p>
                  <Badge variant="secondary">{m.match_score}%</Badge>
                </div>
                <Progress value={m.match_score} className="mt-3 h-1.5" />
                <p className="mt-3 line-clamp-3 text-xs text-muted-foreground">{m.description}</p>
                <p className="mt-3 text-xs text-muted-foreground">{m.salary_range}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="glass-panel rounded-2xl p-5"
        >
          <h2 className="font-display text-lg font-semibold">Skill Gap Analysis</h2>
          <div className="mt-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={gapData} dataKey="value" innerRadius={58} outerRadius={84} paddingAngle={3} strokeWidth={0}>
                  {gapData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RTooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    color: "var(--color-popover-foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 text-sm">
            {gapData.map((g) => (
              <div key={g.name} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: g.color }} />
                <span className="text-muted-foreground">{g.name}</span>
                <span className="ml-auto font-semibold">{g.value}</span>
              </div>
            ))}
          </div>
        </motion.section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Your AI Roadmap</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/roadmap">Open</Link>
            </Button>
          </div>
          <ol className="mt-4 space-y-3">
            {roadmap.slice(0, 5).map((step, i) => (
              <li key={step.id} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                    step.status === "completed"
                      ? "bg-success/20 text-success"
                      : step.status === "in_progress"
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{step.title}</p>
                  <p className="truncate text-xs capitalize text-muted-foreground">
                    {step.status.replace("_", " ")}
                  </p>
                </div>
              </li>
            ))}
            {roadmap.length === 0 && (
              <p className="text-sm text-muted-foreground">Generate a roadmap to see your next steps.</p>
            )}
          </ol>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recommended Courses</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/courses">Browse</Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {(data?.courses ?? []).map((c) => (
              <li key={c.id} className="hover-lift rounded-xl border border-border bg-card/60 p-3">
                <p className="truncate text-sm font-medium">{c.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {c.provider} · {c.difficulty} · ⭐ {c.rating}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Top Internship Matches</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/internships">Browse</Link>
            </Button>
          </div>
          <ul className="mt-4 space-y-3">
            {(data?.internships ?? []).map((job) => (
              <li key={job.id} className="hover-lift flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                  {job.logo_text ?? job.company.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{job.role}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {job.company} · {job.location}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="glass-panel rounded-2xl p-5 xl:col-span-2">
          <h2 className="font-display text-lg font-semibold">Progress Overview</h2>
          <div className="mt-4 h-64">
            {progressData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Take a skill assessment to start tracking your progress.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} stroke="var(--color-muted-foreground)" />
                  <RTooltip
                    cursor={{ fill: "oklch(0.6 0.02 260 / 0.08)" }}
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 12,
                      color: "var(--color-popover-foreground)",
                    }}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="var(--color-primary)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="glass-panel rounded-2xl p-5 text-center">
            <h2 className="font-display text-lg font-semibold">Resume Score</h2>
            <p className="gradient-text mt-4 font-display text-5xl font-bold">
              <AnimatedCounter value={resumeScore} suffix="%" />
            </p>
            <Progress value={resumeScore} className="mt-4 h-2" />
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/resume">
                <FileText className="mr-2 size-4" /> Analyze resume
              </Link>
            </Button>
          </section>

          <section className="glass-panel rounded-2xl p-5">
            <h2 className="font-display text-lg font-semibold">Practice with AI</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sharpen your answers before the real thing.
            </p>
            <div className="mt-4 grid gap-2">
              <Button asChild>
                <Link to="/interview">
                  <Mic className="mr-2 size-4" /> Start mock interview
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/chatbot">
                  <Bot className="mr-2 size-4" /> Ask the AI coach
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/internships">
                  <Briefcase className="mr-2 size-4" /> Find internships
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
