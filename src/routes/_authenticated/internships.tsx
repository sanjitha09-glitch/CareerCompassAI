import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bookmark, BookmarkCheck, ExternalLink, MapPin, Search, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/internships")({
  head: () => ({
    meta: [
      { title: "Internships — CareerCompass AI" },
      { name: "description", content: "Internship matches filtered by role, location, stipend and work mode." },
      { property: "og:title", content: "Internships — CareerCompass AI" },
      { property: "og:description", content: "Find internships that match your skills and save the best ones." },
    ],
  }),
  component: InternshipsPage,
});

function InternshipsPage() {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const [experience, setExperience] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["internships"],
    queryFn: async () => {
      const [jobs, saved] = await Promise.all([
        supabase.from("internships").select("*").order("posted_at", { ascending: false }),
        supabase.from("saved_internships").select("internship_id"),
      ]);
      return {
        jobs: jobs.data ?? [],
        saved: new Set((saved.data ?? []).map((s) => s.internship_id)),
      };
    },
  });

  const toggleSave = useMutation({
    mutationFn: async ({ id, isSaved }: { id: string; isSaved: boolean }) => {
      if (isSaved) {
        const { error } = await supabase.from("saved_internships").delete().eq("internship_id", id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("saved_internships")
          .insert({ internship_id: id, user_id: user!.id });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["internships"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const jobs = (data?.jobs ?? []).filter((job) => {
    const q = query.trim().toLowerCase();
    const matches =
      !q ||
      job.role.toLowerCase().includes(q) ||
      job.company.toLowerCase().includes(q) ||
      job.skills.some((s) => s.toLowerCase().includes(q));
    return (
      matches &&
      (mode === "all" || job.work_mode === mode) &&
      (experience === "all" || job.experience === experience)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Internships" description="Live opportunities matched to your skills and interests." />

      <div className="glass-panel grid gap-3 rounded-2xl p-4 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search role, company or skill" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={mode} onValueChange={setMode}>
          <SelectTrigger><SelectValue placeholder="Work mode" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All work modes</SelectItem>
            <SelectItem value="Remote">Remote</SelectItem>
            <SelectItem value="Hybrid">Hybrid</SelectItem>
            <SelectItem value="On-site">On-site</SelectItem>
          </SelectContent>
        </Select>
        <Select value={experience} onValueChange={setExperience}>
          <SelectTrigger><SelectValue placeholder="Experience" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any experience</SelectItem>
            <SelectItem value="Fresher">Fresher</SelectItem>
            <SelectItem value="0-1 years">0-1 years</SelectItem>
            <SelectItem value="1-2 years">1-2 years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map((job, i) => {
          const isSaved = data?.saved.has(job.id) ?? false;
          return (
            <motion.article
              key={job.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              className="glass-panel hover-lift rounded-2xl p-5"
            >
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-sm font-bold text-primary">
                  {job.logo_text ?? job.company.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display font-semibold">{job.role}</h2>
                  <p className="text-xs text-muted-foreground">{job.company} · via {job.source}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={isSaved ? "Remove from saved" : "Save internship"}
                  onClick={() => toggleSave.mutate({ id: job.id, isSaved })}
                >
                  {isSaved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {job.location} · {job.work_mode}</span>
                {job.stipend && <span className="flex items-center gap-1"><Wallet className="size-3.5" /> {job.stipend}</span>}
                {job.duration && <span>{job.duration}</span>}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {job.skills.slice(0, 5).map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>

              <Button asChild size="sm" className="mt-4">
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  Apply now <ExternalLink className="ml-1 size-3.5" />
                </a>
              </Button>
            </motion.article>
          );
        })}
      </div>

      {!isLoading && jobs.length === 0 && (
        <p className="glass-panel rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No internships match those filters.
        </p>
      )}
    </div>
  );
}
