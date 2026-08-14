import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bot, Compass, FileText, Map, Mic, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerCompass AI — AI Career Guidance for Students" },
      {
        name: "description",
        content:
          "CareerCompass AI matches you to careers, finds your skill gaps, builds a roadmap, scores your resume and runs mock interviews.",
      },
      { property: "og:title", content: "CareerCompass AI — AI Career Guidance for Students" },
      {
        property: "og:description",
        content: "Career matches, roadmaps, ATS resume scoring and AI mock interviews in one workspace.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Target, title: "Career matching", body: "Ranked career paths with match scores, salary bands and demand." },
  { icon: Map, title: "Adaptive roadmaps", body: "Step-by-step plans that update as your skills grow." },
  { icon: FileText, title: "Resume analyzer", body: "ATS scoring with keyword gaps and rewrite suggestions." },
  { icon: Mic, title: "Mock interviews", body: "AI-graded practice with structured, honest feedback." },
  { icon: Bot, title: "AI career coach", body: "A chatbot that actually knows your profile and history." },
  { icon: Sparkles, title: "Skill assessments", body: "Timed quizzes that expose exactly what to learn next." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <span className="gradient-brand grid size-9 place-items-center rounded-xl">
            <Compass className="size-5 text-primary-foreground" />
          </span>
          <span className="font-display font-bold">CareerCompass AI</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Get started</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl font-bold leading-tight sm:text-6xl"
          >
            Stop guessing your career.
            <span className="gradient-text block">Let AI map it.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground"
          >
            CareerCompass AI analyses your skills, interests and assessments to recommend careers,
            close skill gaps, score your resume and prepare you for interviews.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex justify-center gap-3"
          >
            <Button asChild size="lg">
              <Link to="/auth">Start free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          </motion.div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-panel hover-lift rounded-2xl p-6"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="size-5" />
              </span>
              <h2 className="mt-4 font-display font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </motion.article>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CareerCompass AI
      </footer>
    </div>
  );
}
