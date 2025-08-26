import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function generateRemark({
  score,
  total,
  title = "",
  difficulty = "standard",
  weakAreas = [],
  model = process.env.GEMINI_MODEL || "gemini-2.5-flash",
}) {
  const pct = Math.round((score / Math.max(1, total)) * 100);

  const messages = [
    {
      role: "system",
      content:
        "You write brief, encouraging feedback for quiz takers. Output a single short paragraph (max 2 sentences). No markdown.",
    },
    {
      role: "user",
      content: [
        `Quiz: ${title || "Untitled"}`,
        `Difficulty: ${difficulty}`,
        `Score: ${score}/${total} (${pct}%)`,
        weakAreas?.length ? `Weak areas: ${weakAreas.join(", ")}` : "Weak areas: (none provided)",
        "",
        "Write a concise, supportive remark. If they passed (>=70%), congratulate and suggest one focus area.",
        "If <70%, encourage and point to 1–2 specific areas. Avoid repeating the raw score.",
      ].join("\n"),
    },
  ];

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.6,
    messages,
  });

  const text = completion.choices?.[0]?.message?.content?.trim() || "";
  return text;
}
