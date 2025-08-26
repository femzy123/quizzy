import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import QuizCardActions from "@/components/QuizCardActions";
import { deleteQuizAction, duplicateQuizAction } from "./actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("id, title, description, duration_seconds, difficulty, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Quizzes</h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/">Go to Landing</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/quizzes/new">New Quiz</Link>
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">Error: {error.message}</p>}

      {!quizzes?.length ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">You don’t have any quizzes yet.</p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/dashboard/quizzes/new">Create your first quiz</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {quizzes.map((q) => (
            <Card key={q.id}>
              <CardContent className="p-6 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{q.title}</h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>

                {q.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{q.description}</p>
                )}

                <p className="text-sm text-muted-foreground">
                  {q.difficulty} • {Math.round((q.duration_seconds || 0) / 60)} min
                </p>

                <div className="pt-2 flex flex-wrap gap-2 items-center">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/dashboard/quizzes/${q.id}`}>Attempt</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/quizzes/${q.id}/edit`}>Edit</Link>
                  </Button>

                  {/* New actions */}
                  <QuizCardActions
                    quizId={q.id}
                    onDelete={deleteQuizAction}
                    onDuplicate={duplicateQuizAction}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
