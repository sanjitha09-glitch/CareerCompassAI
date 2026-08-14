import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

import { aiJson, aiText, clampText, type AiMessage } from "./ai.server";
import {
  buildLearnerContext,
  CAREER_SYSTEM,
  CHAT_SYSTEM,
  INTERVIEW_SYSTEM,
  QUIZ_SYSTEM,
  RESUME_SYSTEM,
  ROADMAP_SYSTEM,
  type CareerSuggestion,
  type InterviewFeedback,
  type QuizQuestion,
  type ResumeAnalysis,
  type RoadmapStepSuggestion,
} from "./ai-prompts";

const chatInput = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(6000) }))
    .max(20)
    .default([]),
});

export const chatWithCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => chatInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const learner = await buildLearnerContext(supabase, userId);

    const messages: AiMessage[] = [
      { role: "system", content: `${CHAT_SYSTEM}\n\nLearner profile:\n${learner}` },
      ...data.history.map((m) => ({ role: m.role, content: m.content }) as AiMessage),
      { role: "user", content: data.message },
    ];

    const reply = await aiText(messages);

    await supabase.from("chat_history").insert([
      { user_id: userId, role: "user", content: data.message },
      { user_id: userId, role: "assistant", content: reply },
    ]);

    return { reply };
  });

export const generateCareerMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const learner = await buildLearnerContext(supabase, userId);

    const suggestions = await aiJson<CareerSuggestion[]>(
      CAREER_SYSTEM,
      `Recommend 6 careers for this learner.\n${learner}`,
      [],
    );
    if (!suggestions.length) throw new Error("The AI could not generate recommendations. Try again.");

    await supabase.from("career_matches").delete().eq("user_id", userId);
    const rows = suggestions.slice(0, 8).map((s) => ({
      user_id: userId,
      title: String(s.title ?? "Career"),
      match_score: Math.max(0, Math.min(100, Number(s.match_score) || 0)),
      confidence: Math.max(0, Math.min(100, Number(s.confidence) || 0)),
      salary_range: s.salary_range ?? null,
      demand: s.demand ?? null,
      growth: s.growth ?? null,
      description: s.description ?? null,
      required_skills: s.required_skills ?? [],
      missing_skills: s.missing_skills ?? [],
      companies: s.companies ?? [],
      learning_path: s.learning_path ?? [],
    }));
    const { error } = await supabase.from("career_matches").insert(rows);
    if (error) throw new Error(error.message);

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "New career recommendations ready",
      body: `${rows.length} AI-matched career paths were generated for you.`,
      type: "career",
    });

    return { count: rows.length };
  });

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ target: z.string().trim().min(2).max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const learner = await buildLearnerContext(supabase, userId);

    const steps = await aiJson<RoadmapStepSuggestion[]>(
      ROADMAP_SYSTEM,
      `Target career: ${data.target}\n${learner}`,
      [],
    );
    if (!steps.length) throw new Error("The AI could not build a roadmap. Try again.");

    await supabase.from("roadmap_steps").delete().eq("user_id", userId);
    const rows = steps.slice(0, 12).map((s, i) => ({
      user_id: userId,
      title: String(s.title ?? `Step ${i + 1}`),
      description: s.description ?? null,
      step_order: i,
      status: i === 0 ? "in_progress" : i < 2 ? "upcoming" : "locked",
      resources: s.resources ?? [],
      target_career: data.target,
    }));
    const { error } = await supabase.from("roadmap_steps").insert(rows);
    if (error) throw new Error(error.message);

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Roadmap updated",
      body: `Your personalised roadmap for ${data.target} is ready.`,
      type: "roadmap",
    });

    return { count: rows.length };
  });

export const analyzeResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        resumeId: z.string().uuid().optional(),
        text: z.string().trim().min(80, "Resume text is too short to analyse").max(60000),
        targetRole: z.string().trim().max(80).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const analysis = await aiJson<ResumeAnalysis | null>(
      RESUME_SYSTEM,
      `Target role: ${data.targetRole || "Software Engineer"}\n\nResume:\n${clampText(data.text, 20000)}`,
      null,
    );
    if (!analysis) throw new Error("The AI could not analyse this resume. Try again.");

    const row = {
      user_id: userId,
      resume_id: data.resumeId ?? null,
      ats_score: Math.max(0, Math.min(100, Number(analysis.ats_score) || 0)),
      grammar_score: Math.max(0, Math.min(100, Number(analysis.grammar_score) || 0)),
      formatting_score: Math.max(0, Math.min(100, Number(analysis.formatting_score) || 0)),
      keyword_score: Math.max(0, Math.min(100, Number(analysis.keyword_score) || 0)),
      summary: analysis.summary ?? null,
      strengths: analysis.strengths ?? [],
      suggestions: analysis.suggestions ?? [],
      missing_keywords: analysis.missing_keywords ?? [],
      missing_sections: analysis.missing_sections ?? [],
    };
    const { data: inserted, error } = await supabase
      .from("resume_scores")
      .insert(row)
      .select()
      .single();
    if (error) throw new Error(error.message);

    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Resume analysed",
      body: `Your ATS score is ${row.ats_score}/100.`,
      type: "resume",
    });

    return inserted;
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        category: z.string().trim().min(2).max(40),
        difficulty: z.enum(["Easy", "Medium", "Hard", "Mixed"]).default("Mixed"),
        count: z.number().int().min(5).max(20).default(20),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const questions = await aiJson<QuizQuestion[]>(
      QUIZ_SYSTEM,
      `Category: ${data.category}\nDifficulty: ${data.difficulty}\nNumber of questions: ${data.count}`,
      [],
    );

    const valid = questions.filter(
      (q) => Array.isArray(q?.options) && q.options.length === 4 && typeof q.correct_index === "number",
    );

    if (valid.length >= 5) return valid.slice(0, data.count);

    // Fallback to the seeded question bank when the model output is unusable.
    const { data: bank } = await context.supabase
      .from("assessment_questions")
      .select("question, options, correct_index, explanation, difficulty")
      .eq("category", data.category);

    return (bank ?? []).map((q) => ({
      question: q.question,
      options: q.options,
      correct_index: q.correct_index,
      explanation: q.explanation ?? "",
      difficulty: q.difficulty,
    })) as QuizQuestion[];
  });

export const startInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ category: z.string().trim().min(2).max(40) }).parse(input))
  .handler(async ({ data, context }) => {
    const questions = await aiJson<string[]>(
      INTERVIEW_SYSTEM,
      `Generate 6 interview questions for a fresher ${data.category} interview. Return a JSON array of strings.`,
      [],
    );
    if (!questions.length) throw new Error("Could not generate interview questions. Try again.");

    const { data: session, error } = await context.supabase
      .from("interview_sessions")
      .insert({
        user_id: context.userId,
        category: data.category,
        transcript: questions.map((q) => ({ question: q, answer: "" })),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return session;
  });

export const gradeInterview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        sessionId: z.string().uuid(),
        answers: z
          .array(z.object({ question: z.string().max(1000), answer: z.string().max(4000) }))
          .min(1)
          .max(12),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const transcript = data.answers
      .map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer || "(no answer)"}`)
      .join("\n\n");

    const result = await aiJson<InterviewFeedback | null>(
      INTERVIEW_SYSTEM,
      `Evaluate this mock interview and return JSON with score (0-100) and markdown feedback.\n\n${clampText(transcript)}`,
      null,
    );
    if (!result) throw new Error("Could not evaluate the interview. Try again.");

    const score = Math.max(0, Math.min(100, Number(result.score) || 0));
    const { error } = await context.supabase
      .from("interview_sessions")
      .update({
        transcript: data.answers,
        score,
        feedback: result.feedback ?? "",
        completed: true,
      })
      .eq("id", data.sessionId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    await context.supabase.from("activity_logs").insert({
      user_id: context.userId,
      action: "mock_interview",
      detail: `Scored ${score}/100`,
      minutes: 20,
    });

    return { score, feedback: result.feedback ?? "" };
  });
