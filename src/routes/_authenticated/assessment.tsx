import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Clock, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { QuizQuestion } from "@/lib/ai-prompts";
import { generateQuiz } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/assessment")({
  head: () => ({
    meta: [
      { title: "Skill Assessment — CareerCompass AI" },
      { name: "description", content: "Timed AI-generated quizzes that measure your skills and reveal weak areas." },
      { property: "og:title", content: "Skill Assessment — CareerCompass AI" },
      { property: "og:description", content: "Test your skills and get instant AI feedback." },
    ],
  }),
  component: AssessmentPage,
});

const CATEGORIES = ["Programming", "Data Science", "AI/ML", "Web Development", "Aptitude", "Communication"];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"] as const;

function AssessmentPage() {
  const queryClient = useQueryClient();
  const makeQuiz = useServerFn(generateQuiz);
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>("Mixed");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [finished, setFinished] = useState(false);

  const { data: history } = useQuery({
    queryKey: ["assessment-results"],
    queryFn: async () => {
      const { data } = await supabase
        .from("assessment_results")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const active = questions.length > 0 && !finished;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const start = useMutation({
    mutationFn: async () => makeQuiz({ data: { category, difficulty, count: 10 } }),
    onSuccess: (data) => {
      if (!data.length) {
        toast.error("No questions available for this category yet.");
        return;
      }
      setQuestions(data);
      setAnswers(Array(data.length).fill(-1));
      setCurrent(0);
      setSeconds(0);
      setFinished(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const score = useMemo(
    () => questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0),
    [questions, answers],
  );

  const submit = useMutation({
    mutationFn: async () => {
      const weak = questions
        .filter((q, i) => answers[i] !== q.correct_index)
        .map((q) => q.question.slice(0, 80));
      const percent = Math.round((score / questions.length) * 100);
      const { error } = await supabase.from("assessment_results").insert({
        category,
        score: percent,
        total: questions.length,
        duration_seconds: seconds,
        weak_areas: weak.slice(0, 8),
      });
      if (error) throw new Error(error.message);
      await supabase.from("activity_logs").insert({
        action: "assessment_completed",
        detail: `${category} · ${percent}%`,
        minutes: Math.max(1, Math.round(seconds / 60)),
      });
      return percent;
    },
    onSuccess: (percent) => {
      setFinished(true);
      toast.success(`Assessment complete — ${percent}%`);
      queryClient.invalidateQueries({ queryKey: ["assessment-results"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const q = questions[current];

  return (
    <div className="space-y-6">
      <PageHeader title="Skill assessment" description="AI-generated questions calibrated to your chosen skill area." />

      {questions.length === 0 && (
        <div className="glass-panel grid gap-4 rounded-2xl p-5 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Difficulty</label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full" onClick={() => start.mutate()} disabled={start.isPending}>
              {start.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Start assessment
            </Button>
          </div>
        </div>
      )}

      {active && q && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="secondary">
              Question {current + 1} of {questions.length}
            </Badge>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="size-4" />
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
          </div>
          <Progress value={((current + 1) / questions.length) * 100} className="mt-3 h-1.5" />

          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="mt-6 font-display text-lg font-semibold">{q.question}</h2>
              <div className="mt-4 grid gap-2">
                {q.options.map((opt, i) => (
                  <button
                    key={opt}
                    onClick={() => {
                      const next = [...answers];
                      next[current] = i;
                      setAnswers(next);
                    }}
                    className={`rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                      answers[current] === i
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-card/60 hover:bg-accent/10"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="outline" disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
              Previous
            </Button>
            {current < questions.length - 1 ? (
              <Button onClick={() => setCurrent((c) => c + 1)}>Next</Button>
            ) : (
              <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
                {submit.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Submit
              </Button>
            )}
          </div>
        </div>
      )}

      {finished && (
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">Results — {category}</h2>
              <p className="text-sm text-muted-foreground">
                {score}/{questions.length} correct in {Math.floor(seconds / 60)}m {seconds % 60}s
              </p>
            </div>
            <p className="gradient-text font-display text-4xl font-bold">
              {Math.round((score / questions.length) * 100)}%
            </p>
          </div>

          <ul className="mt-5 space-y-3">
            {questions.map((question, i) => {
              const correct = answers[i] === question.correct_index;
              return (
                <li key={question.question} className="rounded-xl border border-border bg-card/60 p-4">
                  <div className="flex items-start gap-2">
                    {correct ? (
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{question.question}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Correct answer: {question.options[question.correct_index]}
                      </p>
                      {question.explanation && (
                        <p className="mt-1 text-xs text-muted-foreground">{question.explanation}</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <Button
            className="mt-5"
            variant="outline"
            onClick={() => {
              setQuestions([]);
              setFinished(false);
            }}
          >
            <RotateCcw className="mr-2 size-4" /> Take another assessment
          </Button>
        </div>
      )}

      {(history ?? []).length > 0 && (
        <section className="glass-panel rounded-2xl p-5">
          <h2 className="font-display text-lg font-semibold">Recent attempts</h2>
          <ul className="mt-3 divide-y divide-border">
            {(history ?? []).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3 text-sm">
                <span>{r.category}</span>
                <span className="text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </span>
                <Badge variant={r.score >= 70 ? "default" : "secondary"}>{r.score}%</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
