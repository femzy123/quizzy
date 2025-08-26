import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { generateQuestions } from "@/lib/ai/generate-questions";

import SubmitButton from "@/components/SubmitButton";
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

export default async function NewQuizPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // ------- server action: create quiz with AI -------
  async function createQuiz(formData) {
    "use server";
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/auth/login");

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const difficulty = String(formData.get("difficulty") || "standard");
    const sourceText = String(formData.get("source_text") || "").trim();

    let count = parseInt(String(formData.get("count") || "10"), 10);
    if (!Number.isFinite(count)) count = 10;
    count = Math.max(1, Math.min(20, count)); // keep within a safe range

    let minutes = parseInt(
      String(formData.get("duration_minutes") || "10"),
      10
    );
    if (!Number.isFinite(minutes) || minutes <= 0) minutes = 10;

    const allowed = FORMAT_OPTIONS.map((f) => f.key);
    const formats = (formData.getAll("formats") || []).filter((v) =>
      allowed.includes(v)
    );
    const selectedFormats = formats.length ? formats : allowed;

    if (!title) throw new Error("Title is required.");

    // 1) Generate questions with Gemini (OpenAI-compat)
    const questions = await generateQuestions({
      title,
      description,
      difficulty,
      formats: selectedFormats,
      minutes,
      sourceText,
      count,
    });

    // 2) Insert the quiz (questions saved in jsonb column)
    const { error } = await supabase.from("quizzes").insert({
      owner_id: user.id,
      title,
      description,
      difficulty,
      duration_seconds: minutes * 60,
      formats: selectedFormats,
      questions, // <— saved here
      feedback: null,
    });

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard");
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">New Quiz</h1>

      <Card>
        <CardContent className="p-6">
          <form action={createQuiz} className="space-y-5">
            <FormPendingOverlay />

            <FormPendingFieldset>
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" required />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full border rounded-md p-2"
                  placeholder="Optional"
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
                    defaultValue="10"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    defaultValue="standard"
                    className="border rounded-md h-10 px-3"
                  >
                    <option value="easy">Easy</option>
                    <option value="standard">Standard</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="count">Number of questions</Label>
                  <Input
                    id="count"
                    name="count"
                    type="number"
                    min={1}
                    max={30}
                    defaultValue={10}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Question formats</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <label key={opt.key} className="flex items-center gap-2">
                      <Checkbox name="formats" value={opt.key} defaultChecked />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Uncheck to narrow formats; leave all checked to let AI use
                  all.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="source_text">
                  Specific instructions / source (optional)
                </Label>
                <SourceTextBox id="source_text" name="source_text" />
              </div>
            </FormPendingFieldset>

            <div className="flex gap-2 pt-2">
              <SubmitButton pendingText="Generating & saving…">
                Generate & Save
              </SubmitButton>
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
