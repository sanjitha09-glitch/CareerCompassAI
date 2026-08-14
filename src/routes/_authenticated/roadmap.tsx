import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Loader2, Lock, Route as RouteIcon, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { generateRoadmap } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/roadmap")({
  validateSearch: (search: Record<string, unknown>) => ({
    target: typeof search["target"] === "string" ? search["target"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Roadmap — CareerCompass AI" },
      { name: "description", content: "A step-by-step AI roadmap from where you are to the role you want." },
      { property: "og:title", content: "Roadmap — CareerCompass AI" },
      { property: "og:description", content: "Adaptive learning steps with resources and progress tracking." },
    ],
  }),
  component: RoadmapPage,
});

function RoadmapPage() {
  const { target } = Route.useSearch();
  const queryClient = useQueryClient();
  const build = useServerFn(generateRoadmap);
  const [goal, setGoal] = useState(target ?? "");

  useEffect(() => {
    if (target) setGoal(target);
  }, [target]);

  const { data, isLoading } = useQuery({
    queryKey: ["roadmap"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roadmap_steps").select("*").order("step_order");
      if (error) throw error;
      return data;
    },
  });

  const generate = useMutation({
    mutationFn: async () => build({ data: { target: goal.trim() } }),
    onSuccess: () => {
      toast.success("Roadmap generated");
      queryClient.invalidateQueries({ queryKey: ["roadmap"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("roadmap_steps").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roadmap"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const steps = data ?? [];
  const done = steps.filter((s) => s.status === "completed").length;
  const percent = steps.length ? Math.round((done / steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your AI roadmap"
        description="Personalised milestones that adapt to your skills and assessment results."
      />

      <div className="glass-panel flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="goal" className="text-sm font-medium">
            Target career
          </label>
          <Input
            id="goal"
            value={goal}
            maxLength={80}
            placeholder="e.g. AI/ML Engineer"
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>
        <Button
          onClick={() => {
            if (goal.trim().length < 2) {
              toast.error("Enter a target career first");
              return;
            }
            generate.mutate();
          }}
          disabled={generate.isPending}
        >
          {generate.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          Generate roadmap
        </Button>
      </div>

      {steps.length > 0 && (
        <div className="glass-panel rounded-2xl p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {done} of {steps.length} steps completed
            </span>
            <span className="font-semibold">{percent}%</span>
          </div>
          <Progress value={percent} className="mt-2 h-2" />
        </div>
      )}

      {isLoading && <Skeleton className="h-96 rounded-2xl" />}

      {!isLoading && steps.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center">
          <RouteIcon className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-display text-lg font-semibold">No roadmap yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Pick a target career above and generate your plan.</p>
        </div>
      )}

      <div className="relative space-y-4 pl-6">
        {steps.length > 0 && <span className="absolute left-[11px] top-2 h-[calc(100%-1rem)] w-px bg-border" />}
        {steps.map((step, i) => {
          const completed = step.status === "completed";
          const locked = step.status === "locked";
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative"
            >
              <span
                className={`absolute -left-6 top-5 grid size-6 place-items-center rounded-full border border-border ${
                  completed ? "bg-success text-success-foreground" : locked ? "bg-muted" : "bg-primary text-primary-foreground"
                }`}
              >
                {completed ? <CheckCircle2 className="size-3.5" /> : locked ? <Lock className="size-3" /> : <Circle className="size-3" />}
              </span>
              <div className="glass-panel hover-lift rounded-2xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-semibold">
                      {i + 1}. {step.title}
                    </h3>
                    {step.target_career && (
                      <p className="text-xs text-muted-foreground">Toward {step.target_career}</p>
                    )}
                  </div>
                  <Badge variant={completed ? "default" : "secondary"} className="capitalize">
                    {step.status.replace("_", " ")}
                  </Badge>
                </div>
                {step.description && <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>}
                {step.resources.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {step.resources.map((r) => (
                      <li key={r}>
                        <Badge variant="outline">{r}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  variant={completed ? "outline" : "default"}
                  size="sm"
                  className="mt-4"
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate({ id: step.id, status: completed ? "in_progress" : "completed" })
                  }
                >
                  {completed ? "Mark as in progress" : "Mark complete"}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
