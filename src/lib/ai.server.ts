const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-5.6-sol";

export type AiMessage = { role: "system" | "user" | "assistant"; content: string };

export async function aiText(messages: AiMessage[]): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: MODEL, reasoning_effort: "none", messages }),
  });

  if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
  if (res.status === 402) throw new Error("AI credits exhausted. Please top up your workspace.");
  if (!res.ok) {
    const body = await res.text();
    console.error("AI gateway error", res.status, body);
    throw new Error(`AI request failed (${res.status})`);
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

/** Ask the model for JSON and parse it defensively. */
export async function aiJson<T>(system: string, user: string, fallback: T): Promise<T> {
  const raw = await aiText([
    { role: "system", content: `${system}\n\nRespond with valid JSON only. No prose, no code fences.` },
    { role: "user", content: user },
  ]);

  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
  if (start === -1 || end === -1) return fallback;

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch (error) {
    console.error("Failed to parse AI JSON", error, cleaned.slice(0, 400));
    return fallback;
  }
}

export function clampText(value: string, max = 12000): string {
  return value.length > max ? `${value.slice(0, max)}\n...[truncated]` : value;
}
