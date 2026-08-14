import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { gradeInterview, startInterview } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({
    meta: [
      { title: "Mock Interview — CareerCompass AI" },
      { name: "description", content: "Practise realistic interview questions and get AI feedback with a score." },
      { property: "og:title", content: "Mock Interview — CareerCompass AI" },
      { property: "og:description", content: "AI-graded mock interviews for freshers." },
    ],
  }),
  component: InterviewPage,
});

const CATEGORIES = ["Software Engineering", "Data Science", "AI/ML", "Product", "HR / Behavioural"];

type Turn = { question: string; answer: string };

function InterviewPage() {
  const begin = useServerFn(startInterview);
  const grade = useServerFn(gradeInterview);
  const [category, setCategory] = useState(CATEGORIES[0]!);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [index, setIndex] = useState(0);
  const [result, setResult] = useState<{ score: number; feedback: string } | null>(null);

  const start = useMutation({
    mutationFn: async () => begin({ data: { category } }),
    onSuccess: (session) => {
      const transcript = (session.transcript as Turn[]) ?? [];
      setSessionId(session.id);
      setTurns(transcript);
      setIndex(0);
      setResult(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const finish = useMutation({
    mutationFn: async () => grade({ data: { sessionId: sessionId!, answers: turns } }),
    onSuccess: (data) => setResult({ score: data.score, feedback: data.feedback }),
    onError: (e: Error) => toast.error(e.message),
  });

  const turn = turns[index];

  return (
    <div className="space-y-6">
      <PageHeader title="Mock interview" description="Answer like it's the real thing — the AI grades structure, depth and clarity." />

      {turns.length === 0 && (
        <div className="glass-panel grid gap-3 rounded-2xl p-5 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => start.mutate()} disabled={start.isPending}>
            {start.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Mic className="mr-2 size-4" />}
            Start interview
          </Button>
        </div>
      )}

      {turn && !result && (
        <div className="glass-panel rounded-2xl p-6">
          <Progress value={((index + 1) / turns.length) * 100} className="h-1.5" />
          <p className="mt-4 text-xs text-muted-foreground">
            Question {index + 1} of {turns.length}
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold">{turn.question}</h2>
          <Textarea
            className="mt-4"
            rows={7}
            value={turn.answer}
            maxLength={4000}
            placeholder="Structure your answer: situation, action, result…"
            onChange={(e) => {
              const next = [...turns];
              next[index] = { ...turn, answer: e.target.value };
              setTurns(next);
            }}
          />
          <div className="mt-4 flex justify-between gap-3">
            <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              Previous
            </Button>
            {index < turns.length - 1 ? (
              <Button onClick={() => setIndex((i) => i + 1)}>Next question</Button>
            ) : (
              <Button onClick={() => finish.mutate()} disabled={finish.isPending}>
                {finish.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Finish & get feedback
              </Button>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="glass-panel rounded-2xl p-6">
          <p className="gradient-text font-display text-5xl font-bold">{result.score}%</p>
          <div className="prose prose-sm prose-invert mt-4 max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.feedback}</ReactMarkdown>
          </div>
          <Button
            className="mt-5"
            variant="outline"
            onClick={() => {
              setTurns([]);
              setResult(null);
              setSessionId(null);
            }}
          >
            Practise again
          </Button>
        </div>
      )}
    </div>
  );
}
