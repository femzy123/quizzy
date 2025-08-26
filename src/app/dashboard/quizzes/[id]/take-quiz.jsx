// app/dashboard/quizzes/[id]/take-quiz.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveAttemptAction } from "@/app/actions/attempts";
import { Loader2 } from "lucide-react";

export default function TakeQuiz({ quiz }) {
  const {
    id: quizId,
    title,
    description,
    difficulty,
    duration_seconds = 600,
    questions = [],
  } = quiz;

  const [timeLeft, setTimeLeft] = useState(duration_seconds);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null); // { score, total, remark }
  const timerRef = useRef(null);

  // start countdown
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  function setAnswer(qid, val) {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");

  async function handleSubmit() {
    if (submitting) return;
    setFinished(true);
    clearInterval(timerRef.current);

    const { score, total } = gradeAll(questions, answers);
    setSubmitting(true);
    try {
      const saved = await saveAttemptAction({
        quizId,
        score,
        total,
        title,
        difficulty,
        weakAreas: [],
      });
      setResult({ score, total, remark: saved?.remark || "" });
    } catch (e) {
      console.error(e);
      setResult({ score, total, remark: "Saved locally. (Could not save remark.)" });
    } finally {
      setSubmitting(false);
    }
  }

  // Results view
  if (finished) {
    const score = result?.score ?? 0;
    const total = result?.total ?? questions.length;

    return (
      <div className="space-y-4">
        {/* Results menu */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Results</h2>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        </div>

        {/* While remark is generating/saving */}
        {submitting && (
          <Card>
            <CardContent className="p-4 flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating results & feedback…
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6 space-y-2">
            <p className="text-lg">
              Score: <strong>{score} / {total}</strong>
            </p>
            {result?.remark && <p className="text-sm text-muted-foreground">{result.remark}</p>}
          </CardContent>
        </Card>

        {/* Keep options visible after submission (disabled), show selection & correct */}
        <div className="space-y-4">
          {questions.map((q, i) => {
            const qid = q.id || String(i + 1);
            const sel = answers[qid];
            const correctInfo = getCorrectInfo(q);
            const isCorrect = compareAnswer(q, sel, correctInfo);
            return (
              <QuestionBlock
                key={qid}           // ✅ unique key
                index={i}           // ✅ provide index for numbering
                q={q}
                qid={qid}           // ✅ stable id for radio groups
                value={sel}
                onChange={() => {}}
                readOnly
                correctness={{ isCorrect, correctInfo }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Taking the quiz
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums">{mins}:{secs}</div>
          <div className="text-xs text-muted-foreground">time left</div>
        </div>
      </div>

      {/* Cancel link */}
      <div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Cancel & return to Dashboard</Link>
        </Button>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const qid = q.id || String(i + 1);
          return (
            <QuestionBlock
              key={qid}                 // ✅ unique key while taking the quiz
              index={i}
              q={q}
              qid={qid}                 // ✅ stable id for radio groups
              value={answers[qid]}
              onChange={(v) => setAnswer(qid, v)}
            />
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit
        </Button>
      </div>

      {/* Inline banner while saving (appears right after clicking submit) */}
      {submitting && (
        <Card>
          <CardContent className="p-4 flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating results & feedback…
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* =====================
   Question rendering
===================== */

function QuestionBlock({
  index = 0,
  q,
  qid,
  value,
  onChange,
  readOnly = false,
  correctness,
}) {
  const isMC = q.type === "multiple_choice" || q.type === "true_false";
  const isFill = q.type === "short_answer" || q.type === "cloze";

  // For fill-in: if options array exists, render choices; else text input
  const hasFillOptions = isFill && Array.isArray(q.options) && q.options.length > 0;

  const displayNum = Number.isFinite(index) ? index + 1 : 1;     // ✅ avoid NaN
  const radioName = `q-${qid || displayNum}`;                    // ✅ stable group name

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-2">
            <span
              className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold"
              aria-hidden
            >
              {displayNum}
            </span>
            <p className="font-medium">{q.question}</p>
          </div>
          {readOnly && correctness && (
            <span className={correctness.isCorrect ? "text-green-600" : "text-red-600"}>
              {correctness.isCorrect ? "✓ Correct" : "✗ Incorrect"}
            </span>
          )}
        </div>

        {/* Multiple choice + True/False (and fill-in with options) */}
        {(isMC || hasFillOptions) && (
          <div className="space-y-2">
            {(Array.isArray(q.options) ? q.options : ["True", "False"]).map((opt, idx) => {
              const selected = String(value) === String(opt);
              const isCorrect =
                readOnly &&
                correctness?.correctInfo?.type === "single" &&
                String(opt).toLowerCase() === String(correctness.correctInfo.value).toLowerCase();

              const klass = [
                "flex items-center gap-2 rounded-md border px-3 py-2",
                readOnly
                  ? isCorrect
                    ? "border-green-600/60 bg-green-600/5"
                    : selected
                    ? "border-red-600/60 bg-red-600/5"
                    : "border-muted"
                  : "border-muted hover:bg-muted/40",
              ].join(" ");

              return (
                <label key={idx} className={klass}>
                  <input
                    type="radio"
                    name={radioName}
                    checked={selected}
                    onChange={() => onChange?.(opt)}
                    disabled={readOnly}
                  />
                  <span>{opt}</span>
                  {readOnly && selected && !isCorrect && (
                    <span className="ml-auto text-xs text-red-600">Your choice</span>
                  )}
                  {readOnly && isCorrect && (
                    <span className="ml-auto text-xs text-green-600">Correct</span>
                  )}
                </label>
              );
            })}
          </div>
        )}

        {/* Short answer / Cloze (free text when no options) */}
        {isFill && !hasFillOptions && (
          <Input
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder="Your answer"
            disabled={readOnly}
          />
        )}

        {/* Matching */}
        {q.type === "matching" && (
          <div className="space-y-2">
            {(q.options?.pairs?.left || []).map((left, i) => {
              const rightOptions = q.options?.pairs?.right || [];
              const chosen = value?.[left] || "";
              const correctRight = q.answers?.mapping?.[left];
              const isCorrect = readOnly && chosen && normalize(chosen) === normalize(correctRight);

              return (
                <div key={`${radioName}-m-${i}`} className="flex items-center gap-2">
                  <div className="min-w-28">{left}</div>
                  <span className="text-muted-foreground">→</span>
                  <select
                    className={`border rounded-md h-9 px-2 ${readOnly ? "opacity-90" : ""}`}
                    value={chosen}
                    onChange={(e) => onChange?.({ ...(value || {}), [left]: e.target.value })}
                    disabled={readOnly}
                  >
                    <option value="">Select…</option>
                    {rightOptions.map((right, j) => (
                      <option key={`${radioName}-r-${i}-${j}`} value={right}>{right}</option>
                    ))}
                  </select>
                  {readOnly && (
                    <span className={`text-xs ${isCorrect ? "text-green-600" : "text-red-600"}`}>
                      {isCorrect ? "Correct" : `Ans: ${correctRight ?? "-"}`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Ordering */}
        {q.type === "ordering" && (
          <OrderEditor
            items={q.options?.order || []}
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            correctOrder={q.answers?.order || []}
            nameSeed={radioName}
          />
        )}

        {readOnly && q.explanation && (
          <p className="text-xs text-muted-foreground">Explanation: {q.explanation}</p>
        )}
      </CardContent>
    </Card>
  );
}

function OrderEditor({
  items,
  value,
  onChange,
  readOnly = false,
  correctOrder = [],
  nameSeed = "order",
}) {
  const arr = Array.isArray(value) && value.length === items.length ? value : items.slice();

  function move(i, delta) {
    if (readOnly) return;
    const j = i + delta;
    if (j < 0 || j >= arr.length) return;
    const copy = arr.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  }

  return (
    <ul className="space-y-2">
      {arr.map((it, i) => {
        const isCorrect = readOnly && normalize(it) === normalize(correctOrder[i]);
        return (
          <li key={`${nameSeed}-o-${i}`} className="flex items-center gap-2">
            <span
              className={`flex-1 border rounded-md px-3 py-2 ${
                readOnly
                  ? isCorrect
                    ? "border-green-600/60 bg-green-600/5"
                    : "border-red-600/60 bg-red-600/5"
                  : "bg-muted/40"
              }`}
            >
              {it}
            </span>
            <div className="flex gap-1">
              <Button type="button" variant="outline" size="sm" onClick={() => move(i, -1)} disabled={readOnly}>
                ↑
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => move(i, 1)} disabled={readOnly}>
                ↓
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* =====================
   Scoring helpers
===================== */

function normalize(s) {
  return String(s ?? "").trim().toLowerCase();
}

function getCorrectInfo(q) {
  switch (q.type) {
    case "multiple_choice":
    case "true_false":
    case "short_answer":
    case "cloze": {
      const a = Array.isArray(q.answers) ? q.answers[0] : undefined;
      return { type: "single", value: a };
    }
    case "matching": {
      return { type: "mapping", value: q.answers?.mapping || {} };
    }
    case "ordering": {
      return { type: "order", value: q.answers?.order || [] };
    }
    default:
      return { type: "single", value: undefined };
  }
}

function compareAnswer(q, userAnswer, correctInfo) {
  switch (q.type) {
    case "multiple_choice":
    case "true_false":
    case "cloze":
    case "short_answer":
      return normalize(userAnswer) === normalize(correctInfo.value);
    case "matching": {
      const mapping = correctInfo.value || {};
      const allLeft = Object.keys(mapping);
      return allLeft.every((left) => normalize(userAnswer?.[left]) === normalize(mapping[left]));
    }
    case "ordering": {
      const expected = correctInfo.value || [];
      const arr = Array.isArray(userAnswer) ? userAnswer : [];
      return arr.length === expected.length && arr.every((v, i) => normalize(v) === normalize(expected[i]));
    }
    default:
      return false;
  }
}

function gradeAll(questions, answers) {
  let score = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const qid = q.id || String(i + 1);
    const ok = compareAnswer(q, answers[qid], getCorrectInfo(q));
    if (ok) score++;
  }
  return { score, total: questions.length };
}
