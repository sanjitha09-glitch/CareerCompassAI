import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatWithCoach } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/chatbot")({
  head: () => ({
    meta: [
      { title: "AI Career Chatbot — CareerCompass AI" },
      { name: "description", content: "Chat with an AI career coach that knows your profile, skills and goals." },
      { property: "og:title", content: "AI Career Chatbot — CareerCompass AI" },
      { property: "og:description", content: "Ask anything about careers, skills and interviews." },
    ],
  }),
  component: ChatbotPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Which career fits my skills best?",
  "How do I become an ML engineer in 6 months?",
  "Review my resume strategy for product roles.",
  "What should I learn next week?",
];

function ChatbotPage() {
  const send = useServerFn(chatWithCoach);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = useMutation({
    mutationFn: async (message: string) =>
      send({ data: { message, history: messages.slice(-10) } }),
    onSuccess: (res) => setMessages((m) => [...m, { role: "assistant", content: res.reply }]),
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = (value: string) => {
    const message = value.trim();
    if (!message) return;
    setMessages((m) => [...m, { role: "user", content: message }]);
    setInput("");
    ask.mutate(message);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="AI career coach" description="Grounded in your profile, skills and assessment history." />

      <div className="glass-panel flex h-[calc(100vh-16rem)] flex-col rounded-2xl">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Try one of these to get started:</p>
              <div className="flex flex-wrap gap-2">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="hover-lift rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card/70"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}

          {ask.isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="flex items-end gap-2 border-t border-border p-4">
          <Textarea
            rows={1}
            value={input}
            maxLength={2000}
            placeholder="Ask your career coach…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
          />
          <Button onClick={() => submit(input)} disabled={ask.isPending} aria-label="Send message">
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
