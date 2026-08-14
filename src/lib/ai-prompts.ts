import type { SupabaseClient } from "@supabase/supabase-js";

export type CareerSuggestion = {
  title: string;
  match_score: number;
  confidence: number;
  salary_range?: string;
  demand?: string;
  growth?: string;
  description?: string;
  required_skills?: string[];
  missing_skills?: string[];
  companies?: string[];
  learning_path?: string[];
};

export type RoadmapStepSuggestion = {
  title: string;
  description?: string;
  resources?: string[];
};

export type ResumeAnalysis = {
  ats_score: number;
  grammar_score: number;
  formatting_score: number;
  keyword_score: number;
  summary?: string;
  strengths?: string[];
  suggestions?: string[];
  missing_keywords?: string[];
  missing_sections?: string[];
};

export type QuizQuestion = {
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
  difficulty?: string;
};

export type InterviewFeedback = { score: number; feedback: string };

export const CHAT_SYSTEM = `You are CareerCompass AI, a warm, sharp career mentor for students and early-career engineers.
Answer questions on careers, resumes, interviews, courses, programming, placements, higher studies, internships and scholarships.
Be specific and actionable, use short markdown sections, bullet lists and fenced code blocks where code helps.
Never invent job offers or fake links. If unsure, say so and suggest how to verify.`;

export const CAREER_SYSTEM = `You are a career recommendation engine. Given a learner profile, return a JSON array of career objects.
Each object: { "title", "match_score" (0-100), "confidence" (0-100), "salary_range" (INR range), "demand", "growth",
"description" (2 sentences), "required_skills" (6 strings), "missing_skills" (up to 5 strings the learner lacks),
"companies" (5 real hiring companies), "learning_path" (6 ordered steps) }.
Base match_score on overlap between the learner's skills/interests/assessments and the role, and reflect real 2026 market demand.`;

export const ROADMAP_SYSTEM = `You are a learning-path architect. Return a JSON array of 8-10 ordered roadmap steps.
Each object: { "title" (short, e.g. "Data Structures & Algorithms"), "description" (1-2 sentences on what to master and how to prove it),
"resources" (2-4 concrete free or well known resources by name) }. Order them from fundamentals to placement readiness.`;

export const RESUME_SYSTEM = `You are an ATS and technical recruiter. Analyse the resume text and return a JSON object:
{ "ats_score", "grammar_score", "formatting_score", "keyword_score" (all 0-100),
"summary" (3 sentences), "strengths" (3-5), "suggestions" (5-8 concrete rewrites),
"missing_keywords" (5-10 role-relevant keywords absent from the resume), "missing_sections" (any standard section that is missing) }.
Be strict and honest; do not inflate scores.`;

export const QUIZ_SYSTEM = `You are an assessment generator. Return a JSON array of multiple-choice questions.
Each object: { "question", "options" (exactly 4 distinct strings), "correct_index" (0-3), "explanation" (1 sentence), "difficulty" ("Easy"|"Medium"|"Hard") }.
Questions must be technically accurate, unambiguous and interview-relevant.`;

export const INTERVIEW_SYSTEM = `You are a senior interviewer running a mock interview for a fresher.
When asked for questions, return a JSON array of question strings mixing fundamentals, applied scenarios and one behavioural question.
When asked to evaluate, return { "score" (0-100), "feedback" (markdown with Strengths, Gaps, Model Answers, Next Steps) }.`;

/** Compact snapshot of the learner used to ground every AI call. */
export async function buildLearnerContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const [profile, skills, results] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, college, degree, branch, year, cgpa, skills, interests, headline, bio")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_skills").select("name, level, status").eq("user_id", userId).limit(40),
    supabase
      .from("assessment_results")
      .select("category, score, total")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const p = profile.data as Record<string, unknown> | null;
  const lines = [
    `Name: ${p?.["full_name"] ?? "Student"}`,
    `Headline: ${p?.["headline"] ?? "—"}`,
    `Education: ${p?.["degree"] ?? "—"} ${p?.["branch"] ?? ""} at ${p?.["college"] ?? "—"} (year ${p?.["year"] ?? "—"}, CGPA ${p?.["cgpa"] ?? "—"})`,
    `Skills: ${((p?.["skills"] as string[] | undefined) ?? []).join(", ") || "not provided"}`,
    `Interests: ${((p?.["interests"] as string[] | undefined) ?? []).join(", ") || "not provided"}`,
    `Tracked skill levels: ${
      (skills.data ?? [])
        .map((s: Record<string, unknown>) => `${s["name"]} (${s["level"]}%, ${s["status"]})`)
        .join("; ") || "none"
    }`,
    `Assessment scores: ${
      (results.data ?? [])
        .map((r: Record<string, unknown>) => `${r["category"]}: ${r["score"]}/${r["total"]}`)
        .join("; ") || "none yet"
    }`,
    `About: ${p?.["bio"] ?? "—"}`,
  ];
  return lines.join("\n");
}
