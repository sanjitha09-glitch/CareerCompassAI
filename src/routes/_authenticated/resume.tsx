import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { analyzeResume } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title: "Resume Analyzer — CareerCompass AI" },
      { name: "description", content: "Upload your resume for ATS scoring, keyword gaps and AI improvement suggestions." },
      { property: "og:title", content: "Resume Analyzer — CareerCompass AI" },
      { property: "og:description", content: "Get an ATS score and concrete fixes for your resume." },
    ],
  }),
  component: ResumePage,
});

function ResumePage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const analyze = useServerFn(analyzeResume);
  const [text, setText] = useState("");
  const [role, setRole] = useState("Software Engineer");
  const [busy, setBusy] = useState(false);

  const { data: latest } = useQuery({
    queryKey: ["resume-score"],
    queryFn: async () => {
      const { data } = await supabase
        .from("resume_scores")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0] ?? null;
    },
  });

  const run = useMutation({
    mutationFn: async () => analyze({ data: { text: text.trim(), targetRole: role.trim() } }),
    onSuccess: () => {
      toast.success("Resume analysed");
      queryClient.invalidateQueries({ queryKey: ["resume-score"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFile = async (file: File) => {
    if (!user) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("File must be under 8MB");
      return;
    }
    setBusy(true);
    try {
      const { extractResumeText } = await import("@/lib/resume-parser");
      const extracted = await extractResumeText(file);
      setText(extracted);
      const path = `${user.id}/${Date.now()}-${file.name}`;
      await supabase.storage.from("resumes").upload(path, file);
      await supabase.from("resumes").insert({ user_id: user.id, file_name: file.name, file_path: path });
      toast.success("Resume uploaded and text extracted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not read that file");
    } finally {
      setBusy(false);
    }
  };

  const metrics = latest
    ? [
        { label: "ATS score", value: latest.ats_score },
        { label: "Keywords", value: latest.keyword_score },
        { label: "Formatting", value: latest.formatting_score },
        { label: "Grammar", value: latest.grammar_score },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Resume analyzer" description="ATS scoring, keyword gaps and rewrite suggestions powered by AI." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel space-y-4 rounded-2xl p-5">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
            {busy ? <Loader2 className="size-6 animate-spin text-primary" /> : <Upload className="size-6 text-primary" />}
            <span className="mt-2 text-sm font-medium">Upload PDF or DOCX</span>
            <span className="text-xs text-muted-foreground">We extract the text and score it against your target role</span>
            <input
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
          </label>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">Target role</label>
            <Input id="role" value={role} maxLength={80} onChange={(e) => setRole(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label htmlFor="text" className="text-sm font-medium">Resume text</label>
            <Textarea id="text" rows={10} value={text} maxLength={60000} placeholder="Paste your resume text here…" onChange={(e) => setText(e.target.value)} />
          </div>

          <Button
            className="w-full"
            disabled={run.isPending}
            onClick={() => {
              if (text.trim().length < 80) {
                toast.error("Add more resume text before analysing");
                return;
              }
              run.mutate();
            }}
          >
            {run.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileText className="mr-2 size-4" />}
            Analyze resume
          </Button>
        </section>

        <section className="glass-panel space-y-4 rounded-2xl p-5">
          {!latest && <p className="text-sm text-muted-foreground">Run an analysis to see your scores here.</p>}
          {latest && (
            <>
              <div className="text-center">
                <p className="gradient-text font-display text-5xl font-bold">{latest.ats_score}%</p>
                <p className="text-xs text-muted-foreground">Overall ATS readiness</p>
              </div>
              <div className="space-y-3">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-semibold">{m.value}%</span>
                    </div>
                    <Progress value={m.value} className="mt-1 h-1.5" />
                  </div>
                ))}
              </div>
              {latest.summary && <p className="text-sm text-muted-foreground">{latest.summary}</p>}
              {latest.strengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Strengths</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {latest.strengths.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              )}
              {latest.suggestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Suggestions</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {latest.suggestions.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </div>
              )}
              {latest.missing_keywords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Missing keywords</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {latest.missing_keywords.map((k) => <Badge key={k} variant="outline">{k}</Badge>)}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
