import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ExternalLink, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({
    meta: [
      { title: "Courses — CareerCompass AI" },
      { name: "description", content: "Curated courses matched to the skills your target career needs." },
      { property: "og:title", content: "Courses — CareerCompass AI" },
      { property: "og:description", content: "Filter courses by provider, difficulty and skill." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [price, setPrice] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*").order("rating", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const providers = useMemo(
    () => Array.from(new Set((data ?? []).map((c) => c.provider))).sort(),
    [data],
  );

  const filtered = (data ?? []).filter((c) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.skills.some((s) => s.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q);
    return (
      matchesQuery &&
      (provider === "all" || c.provider === provider) &&
      (difficulty === "all" || c.difficulty === difficulty) &&
      (price === "all" || c.price.toLowerCase() === price)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="Hand-picked learning resources for the skills you're missing." />

      <div className="glass-panel grid gap-3 rounded-2xl p-4 md:grid-cols-4">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search courses" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All providers</SelectItem>
            {providers.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            <SelectItem value="Beginner">Beginner</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={price} onValueChange={setPrice}>
          <SelectTrigger><SelectValue placeholder="Price" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Free & paid</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((c, i) => (
          <motion.article
            key={c.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }}
            className="glass-panel hover-lift flex flex-col rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <Badge variant="secondary">{c.provider}</Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="size-3.5 fill-warning text-warning" /> {c.rating}
              </span>
            </div>
            <h2 className="mt-3 font-display font-semibold">{c.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.instructor ? `${c.instructor} · ` : ""}
              {c.duration} · {c.difficulty}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.skills.slice(0, 4).map((s) => (
                <Badge key={s} variant="outline">{s}</Badge>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-5">
              <span className="text-sm font-semibold capitalize">{c.price}</span>
              <Button asChild size="sm" variant="outline">
                <a href={c.url} target="_blank" rel="noopener noreferrer">
                  Enroll <ExternalLink className="ml-1 size-3.5" />
                </a>
              </Button>
            </div>
          </motion.article>
        ))}
      </div>

      {!isLoading && filtered.length === 0 && (
        <p className="glass-panel rounded-2xl p-10 text-center text-sm text-muted-foreground">
          No courses match those filters.
        </p>
      )}
    </div>
  );
}
