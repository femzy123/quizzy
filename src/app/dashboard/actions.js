"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { generateQuestions } from "@/lib/ai/generate-questions";

/** Delete a quiz (RLS: owner-only). Attempts are removed via ON DELETE CASCADE. */
export async function deleteQuizAction(formData) {
  const quizId = String(formData.get("quizId") || "").trim();
  if (!quizId) throw new Error("Missing quizId");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId)
    .eq("owner_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
}

/** Duplicate a quiz with freshly generated questions (same settings, new items). */
export async function duplicateQuizAction(formData) {
  const quizId = String(formData.get("quizId") || "").trim();
  if (!quizId) throw new Error("Missing quizId");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Get the quiz you own
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("title, description, difficulty, duration_seconds, formats, questions")
    .eq("id", quizId)
    .eq("owner_id", user.id)
    .single();

  if (error || !quiz) throw new Error(error?.message || "Quiz not found");

  const count = Array.isArray(quiz.questions) && quiz.questions.length > 0 ? quiz.questions.length : 10;
  const minutes = Math.max(1, Math.round((quiz.duration_seconds || 600) / 60));

  // Generate a different set (temperature>0 is already used in the util)
  const questions = await generateQuestions({
    title: quiz.title,
    description: quiz.description || "",
    difficulty: quiz.difficulty || "standard",
    formats: quiz.formats || [
      "multiple_choice","true_false","short_answer","cloze","matching","ordering"
    ],
    minutes,
    sourceText: "",   // not stored; you can add a source_text column later if needed
    count,
  });

  const { data: inserted, error: insErr } = await supabase
    .from("quizzes")
    .insert({
      owner_id: user.id,
      title: `${quiz.title} (Copy)`,
      description: quiz.description,
      difficulty: quiz.difficulty,
      duration_seconds: quiz.duration_seconds,
      formats: quiz.formats,
      questions,
    })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);

  revalidatePath("/dashboard");
  return { id: inserted.id };
}
