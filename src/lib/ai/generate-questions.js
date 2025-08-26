// Server-only helper that calls Gemini via OpenAI-compat Chat Completions.
// Keep GEMINI_API_KEY on the server (.env.local).

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const SUPPORTED = new Set([
  "multiple_choice",
  "true_false",
  "short_answer",
  "cloze",
  "matching",
  "ordering",
]);

export async function generateQuestions({
  title,
  description,
  difficulty = "standard",
  formats = Array.from(SUPPORTED),
  minutes = 10,
  sourceText = "",
  count = 10,
  model = process.env.GEMINI_MODEL || "gemini-2.5-flash",
}) {
  const prompt = buildPrompt({
    title,
    description,
    difficulty,
    formats,
    minutes,
    sourceText,
    count,
  });

  const completion = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content:
          "You generate quizzes and must output ONLY a JSON array of question objects. No prose, no markdown fences.",
      },
      { role: "user", content: prompt },
    ],
  });

  const msg = completion.choices?.[0]?.message;
  const text = extractText(msg);
  const arr = parseJSONArray(text);
  const safeCount = Math.max(1, Math.min(20, Number(count) || 10));
  return arr.slice(0, safeCount).map(normalizeQuestion);
}

function buildPrompt({
  title,
  description,
  difficulty,
  formats,
  minutes,
  sourceText,
  count,
}) {
  const schema = `Return ONLY a JSON array (no markdown). Each item:
{
  "question": "string",
  "type": "multiple_choice" | "true_false" | "short_answer" | "cloze" | "matching" | "ordering",
  "options": [] | { "pairs": { "left": [], "right": [] } , "order": [] },
  "answers": [] | { "mapping": { }, "order": [] },
  "explanation": "string (optional)"
}`;
  const rules = `Rules:
- Allowed types ONLY: ${formats.join(", ")}.
- multiple_choice: 3–5 options; answers = [exact correct option text].
- true_false: options=["True","False"]; answers=["True"] or ["False"].
- short_answer: answers=[one or more acceptable strings].
- cloze: single blank written as "___"; 3-5 options; answers=[exact correct option text].
- matching: options.pairs.left/right same length; answers.mapping maps each left->right.
- ordering: options.order is the correct order; answers.order repeats it.
- Output strictly valid JSON (no commentary or code fences).`;

  return `Generate EXACTLY ${count} questions 
  Title: "${title}"
Description: ${description || "N/A"}
Difficulty: ${difficulty}
Target duration: ~${minutes} minutes for the whole quiz.
Source (optional, use if present):
${sourceText || "(none)"}

${schema}

${rules}`;
}

function extractText(message) {
  if (!message) return "";
  // OpenAI SDK usually returns a string; be robust just in case
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => (typeof part === "string" ? part : part?.text ?? ""))
      .join("");
  }
  return "";
}

function parseJSONArray(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
  } catch (_) {}
  const s = cleaned.indexOf("[");
  const e = cleaned.lastIndexOf("]");
  if (s !== -1 && e !== -1 && e > s) return JSON.parse(cleaned.slice(s, e + 1));
  throw new Error("Failed to parse AI JSON array");
}

function normalizeQuestion(q, idx) {
  const id = String(idx + 1);
  const type = String(q.type || "").toLowerCase();
  const base = {
    id,
    question: q.question || `Question ${id}`,
    type: SUPPORTED.has(type) ? type : "multiple_choice",
    explanation: q.explanation || "",
  };

  if (type === "matching") {
    const pairs = q?.options?.pairs || { left: [], right: [] };
    const mapping = q?.answers?.mapping || {};
    return { ...base, options: { pairs }, answers: { mapping } };
  }
  if (type === "ordering") {
    const order = q?.options?.order || [];
    return {
      ...base,
      options: { order },
      answers: { order: q?.answers?.order || order },
    };
  }

  const options = Array.isArray(q.options)
    ? q.options
    : type === "true_false"
    ? ["True", "False"]
    : [];
  const answers = Array.isArray(q.answers) ? q.answers : [];
  return { ...base, options, answers };
}
