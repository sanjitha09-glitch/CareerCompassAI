import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { PageHeader } from "@/components/common/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser, useProfile } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — CareerCompass AI" },
      { name: "description", content: "Manage your education, skills, interests and links so the AI can personalise guidance." },
      { property: "og:title", content: "Profile — CareerCompass AI" },
      { property: "og:description", content: "Keep your career profile sharp and AI-ready." },
    ],
  }),
  component: ProfilePage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").max(80),
  headline: z.string().trim().max(120),
  bio: z.string().trim().max(600),
  college: z.string().trim().max(120),
  degree: z.string().trim().max(80),
  branch: z.string().trim().max(80),
  year: z.string().trim().max(20),
  location: z.string().trim().max(80),
  cgpa: z.number().min(0).max(10).nullable(),
  linkedin_url: z.string().trim().url("Enter a valid URL").max(200).or(z.literal("")),
  github_url: z.string().trim().url("Enter a valid URL").max(200).or(z.literal("")),
  portfolio_url: z.string().trim().url("Enter a valid URL").max(200).or(z.literal("")),
});

type FormKey =
  | "full_name"
  | "headline"
  | "bio"
  | "college"
  | "degree"
  | "branch"
  | "year"
  | "location"
  | "cgpa"
  | "linkedin_url"
  | "github_url"
  | "portfolio_url";

type FormState = Record<FormKey, string>;

const emptyForm: FormState = {
  full_name: "",
  headline: "",
  bio: "",
  college: "",
  degree: "",
  branch: "",
  year: "",
  location: "",
  cgpa: "",
  linkedin_url: "",
  github_url: "",
  portfolio_url: "",
};

type TagKey = "skills" | "interests" | "languages";

function ProfilePage() {
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [tags, setTags] = useState<Record<TagKey, string[]>>({ skills: [], interests: [], languages: [] });
  const [drafts, setDrafts] = useState<Record<TagKey, string>>({ skills: "", interests: "", languages: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      headline: profile.headline ?? "",
      bio: profile.bio ?? "",
      college: profile.college ?? "",
      degree: profile.degree ?? "",
      branch: profile.branch ?? "",
      year: profile.year ?? "",
      location: profile.location ?? "",
      cgpa: profile.cgpa != null ? String(profile.cgpa) : "",
      linkedin_url: profile.linkedin_url ?? "",
      github_url: profile.github_url ?? "",
      portfolio_url: profile.portfolio_url ?? "",
    });
    setTags({
      skills: profile.skills ?? [],
      interests: profile.interests ?? [],
      languages: profile.languages ?? [],
    });
  }, [profile]);

  const completion = (() => {
    const fields = [form["full_name"], form["headline"], form["college"], form["degree"], form["branch"], form["year"], form["bio"]];
    const filled = fields.filter((f) => f && f.trim().length > 0).length;
    const tagScore = (tags.skills.length ? 1 : 0) + (tags.interests.length ? 1 : 0);
    return Math.round(((filled + tagScore) / (fields.length + 2)) * 100);
  })();

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse({
        ...form,
        cgpa: form["cgpa"] ? Number(form["cgpa"]) : null,
      });
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const { error } = await supabase
        .from("profiles")
        .update({
          ...parsed.data,
          linkedin_url: parsed.data.linkedin_url || null,
          github_url: parsed.data.github_url || null,
          portfolio_url: parsed.data.portfolio_url || null,
          skills: tags.skills,
          interests: tags.interests,
          languages: tags.languages,
          onboarding_complete: true,
        })
        .eq("id", user!.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Profile saved");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4MB");
      return;
    }
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
    await supabase.from("profiles").update({ avatar_url: signed?.signedUrl ?? null }).eq("id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    setUploading(false);
    toast.success("Photo updated");
  };

  const addTag = (key: TagKey) => {
    const value = drafts[key].trim();
    if (!value || value.length > 40) return;
    if (tags[key].includes(value)) return;
    setTags({ ...tags, [key]: [...tags[key], value] });
    setDrafts({ ...drafts, [key]: "" });
  };

  const field = (key: FormKey, label: string, placeholder?: string) => (
    <div className="space-y-2">
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your profile"
        description="The richer your profile, the sharper your AI recommendations."
        actions={
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />} Save changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass-panel space-y-4 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="Your profile photo" />}
              <AvatarFallback className="bg-primary/15 text-primary">
                {(form["full_name"] || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{form["full_name"] || "Your name"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-1 text-xs text-primary">
                {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
                Change photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadAvatar(file);
                  }}
                />
              </label>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profile completion</span>
              <span className="font-semibold">{completion}%</span>
            </div>
            <Progress value={completion} className="mt-2 h-2" />
          </div>

          {(["skills", "interests", "languages"] as TagKey[]).map((key) => (
            <div key={key} className="space-y-2">
              <Label className="capitalize">{key}</Label>
              <div className="flex flex-wrap gap-1.5">
                {tags[key].map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      aria-label={`Remove ${tag}`}
                      onClick={() => setTags({ ...tags, [key]: tags[key].filter((t) => t !== tag) })}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={drafts[key]}
                  placeholder={`Add ${key.slice(0, -1)}`}
                  onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(key);
                    }
                  }}
                />
                <Button variant="outline" size="icon" onClick={() => addTag(key)} aria-label={`Add ${key}`}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </section>

        <section className="glass-panel space-y-4 rounded-2xl p-5 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {field("full_name", "Full name", "Aarav Sharma")}
            {field("headline", "Headline", "Final-year CSE student · aspiring ML engineer")}
            {field("college", "College", "IIT Delhi")}
            {field("degree", "Degree", "B.Tech")}
            {field("branch", "Branch", "Computer Science")}
            {field("year", "Year", "Final year")}
            {field("cgpa", "CGPA", "8.6")}
            {field("location", "Location", "Bengaluru, India")}
            {field("linkedin_url", "LinkedIn URL", "https://linkedin.com/in/…")}
            {field("github_url", "GitHub URL", "https://github.com/…")}
            {field("portfolio_url", "Portfolio URL", "https://…")}
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">About you</Label>
            <Textarea
              id="bio"
              rows={5}
              value={form["bio"]}
              maxLength={600}
              placeholder="What are you building, and where do you want to be in two years?"
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
