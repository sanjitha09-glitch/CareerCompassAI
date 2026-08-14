import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Compass, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CareerCompass AI" },
      {
        name: "description",
        content: "Sign in or create your CareerCompass AI account to unlock AI career guidance.",
      },
      { property: "og:title", content: "Sign in — CareerCompass AI" },
      { property: "og:description", content: "Access your AI career mentor, roadmaps and mock interviews." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signIn = async () => {
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0]!.message);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  const signUp = async () => {
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(parsed.error.issues[0]!.message);
    if (fullName.trim().length < 2) return toast.error("Please enter your full name");
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: fullName.trim() },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    if (!data.session) {
      toast.success("Check your email to confirm your account.");
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      return toast.error("Google sign-in failed. Try again.");
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  const forgotPassword = async () => {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) return toast.error("Enter your email first");
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent.");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden border-r border-border lg:block">
        <div className="gradient-brand absolute inset-0 opacity-90" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Compass className="size-6" />
            </span>
            <span className="font-display text-lg font-bold">CareerCompass AI</span>
          </div>
          <div className="max-w-md space-y-5">
            <h2 className="font-display text-4xl font-bold leading-tight">
              Your AI mentor for the career you actually want.
            </h2>
            <p className="text-sm text-primary-foreground/80">
              Personalised career matches, skill-gap analysis, adaptive roadmaps, ATS resume scoring
              and realistic mock interviews — all in one workspace.
            </p>
            <ul className="space-y-2 text-sm text-primary-foreground/90">
              <li>• AI career matching with confidence scores</li>
              <li>• Roadmaps that adapt to your assessment results</li>
              <li>• Resume ATS analysis with actionable fixes</li>
            </ul>
          </div>
          <p className="text-xs text-primary-foreground/70">Built for students and early-career talent.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass-panel w-full max-w-md rounded-3xl p-7"
        >
          <h1 className="font-display text-2xl font-bold">Welcome to CareerCompass AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to continue your career journey.
          </p>

          <Button variant="outline" className="mt-6 w-full" onClick={google} disabled={loading}>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button className="w-full" onClick={signIn} disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Sign in
              </Button>
              <button onClick={forgotPassword} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
                Forgot your password?
              </button>
            </TabsContent>

            <TabsContent value="signup" className="mt-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aarav Sharma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email2">Email</Label>
                <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@college.edu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password2">Password</Label>
                <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
              </div>
              <Button className="w-full" onClick={signUp} disabled={loading}>
                {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Create account
              </Button>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
