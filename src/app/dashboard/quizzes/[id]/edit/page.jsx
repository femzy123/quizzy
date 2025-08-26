// app/dashboard/quizzes/[id]/edit/page.jsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { generateQuestions } from "@/lib/ai/generate-questions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PendingSubmit from "@/components/PendingSubmit"; // ✅ client submit button

// Optional helpers you added earlier. If you didn't, remove these two lines.
import FormPendingFieldset from "@/components/FormPendingFieldset";
import FormPendingOverlay from "@/components/FormPendingOverlay";
import SourceTextBox from "@/components/SourceTextBox";

const FORMAT_OPTIONS = [
  { key: "multiple_choice", label: "Multiple choice" },
  { key: "true_false", label: "True/False" },
  { key: "short_answer", label: "Short answer" },
  { key: "cloze", label: "Cloze (fill-in)" },
  { key: "matching", label: "Matching" },
  { key: "ordering", label: "Ordering" },
];

export default async function EditQuizPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load quiz (owner-only via RLS)
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select(
      "id, title, description, difficulty, duration_seconds, formats, questions"
    )
    .eq("id", id)
    .single();

  if (error || !quiz) redirect("/dashboard");

  // Count attempts to show a caution
  const { count: attemptsCount = 0 } = await supabase
    .from("attempts")
    .select("*", { count: "exact", head: true })
    .eq("quiz_id", id);

  // ---------- action ----------
  async function updateQuiz(formData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const difficulty = String(formData.get("difficulty") || "standard");
    let minutes = parseInt(
      String(formData.get("duration_minutes") || "10"),
      10
    );
    if (!Number.isFinite(minutes) || minutes <= 0) minutes = 10;

    // formats
    const allowed = FORMAT_OPTIONS.map((f) => f.key);
    const rawFormats = formData.getAll("formats") || [];
    const formats = rawFormats.filter((v) => allowed.includes(v));
    const selectedFormats = formats.length ? formats : allowed;

    // distinguish which button was pressed
    const action = String(formData.get("action") || "save");
    const shouldRegen = action === "regen";

    // regen-only inputs
    let count = parseInt(
      String(formData.get("count") || (quiz.questions?.length ?? "10")),
      10
    );
    if (!Number.isFinite(count)) count = 10;
    count = Math.max(1, Math.min(20, count));
    const sourceText = String(formData.get("source_text") || "").trim();

    const update = {
      title,
      description,
      difficulty,
      duration_seconds: minutes * 60,
      formats: selectedFormats,
    };

    if (shouldRegen) {
      const newQs = await generateQuestions({
        title,
        description,
        difficulty,
        formats: selectedFormats,
        minutes,
        sourceText,
        count,
      });
      update.questions = newQs;
    }

    const { error: upErr } = await supabase
      .from("quizzes")
      .update(update)
      .eq("id", params.id);

    if (upErr) throw new Error(upErr.message);

    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  const selected = new Set(quiz.formats || FORMAT_OPTIONS.map((f) => f.key));
  const defaultCount =
    Array.isArray(quiz.questions) && quiz.questions.length > 0
      ? quiz.questions.length
      : 10;

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Quiz</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/quizzes/${quiz.id}`}>Open</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>

      {attemptsCount > 0 && (
        <Card>
          <CardContent className="p-4 text-sm">
            <p className="text-red-600">
              Heads up: this quiz has {attemptsCount} attempt
              {attemptsCount > 1 ? "s" : ""}. Regenerating questions will change
              future attempts; past attempts remain recorded against the old
              questions.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="relative">
        {/* Optional overlay if you created it earlier */}
        <FormPendingOverlay />
        <CardContent className="p-6">
          <form action={updateQuiz} className="space-y-5">
            {/* Optional fieldset if you created it earlier */}
            <FormPendingFieldset>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={quiz.title}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full border rounded-md p-2"
                  defaultValue={quiz.description || ""}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min="1"
                    defaultValue={Math.max(
                      1,
                      Math.round((quiz.duration_seconds || 600) / 60)
                    )}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    defaultValue={quiz.difficulty || "standard"}
                    className="border rounded-md h-10 px-3"
                  >
                    <option value="easy">Easy</option>
                    <option value="standard">Standard</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Question formats</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="formats"
                        value={opt.key}
                        defaultChecked={selected.has(opt.key)}
                      />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Regeneration inputs (used only when clicking "Regenerate & Save") */}
              <div className="grid gap-2">
                <Label htmlFor="count">
                  Number of questions (for regeneration)
                </Label>
                <Input
                  id="count"
                  name="count"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue={defaultCount}
                />
                <p className="text-xs text-muted-foreground">
                  Only used if you click <em>Regenerate &amp; Save</em>.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="source_text">
                  Specific instructions / source (optional)
                </Label>
                <SourceTextBox
                  id="source_text"
                  name="source_text"
                  // defaultValue only used when regenerating (safe to prefill with nothing)
                  defaultValue=""
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Used only when you click <em>Regenerate &amp; Save</em>.
                </p>
              </div>
            </FormPendingFieldset>

            <div className="flex flex-wrap gap-2 pt-2">
              {/* Save only (metadata & formats) */}
              <PendingSubmit name="action" value="save" pendingText="Saving…">
                Save changes
              </PendingSubmit>

              {/* Regenerate questions with new inputs */}
              <PendingSubmit
                name="action"
                value="regen"
                pendingText="Regenerating & saving…"
              >
                Regenerate &amp; Save
              </PendingSubmit>

              <Button asChild variant="outline">
                <Link href="/dashboard">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
