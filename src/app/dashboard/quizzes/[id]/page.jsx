import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import TakeQuiz from "./take-quiz";

export default async function QuizPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, title, description, difficulty, duration_seconds, questions")
    .eq("id", id)
    .single();

  if (error || !quiz) notFound();

  return (
    <main className="mx-auto max-w-3xl p-6">
      <TakeQuiz quiz={quiz} />
    </main>
  );
}
