// app/page.jsx
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import SiteHeader from '@/components/SiteHeader';
import { createClient } from '@/utils/supabase/server'; // your server.js export

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ctaHref = user ? '/dashboard' : '/auth/login';

  return (
    <main className="scroll-smooth">
      <SiteHeader isAuthed={!!user} />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20" id="hero">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">
              Turn your notes into quizzes — instantly.
            </h1>
            <p className="text-muted-foreground text-lg">
              Paste content, pick question types, and generate a timed quiz with instant scoring.
            </p>
            <div className="flex gap-3">
              <Button asChild size="lg"><Link href={ctaHref}>Build a quiz</Link></Button>
              <Button asChild size="lg" variant="outline"><a href="#how">See how it works</a></Button>
            </div>
          </div>

          <Card className="border-dashed">
            <CardContent className="p-6">
              <div className="rounded-2xl border p-4 shadow-sm">
                <div className="mb-4 text-sm text-muted-foreground">Preview</div>
                <div className="space-y-3">
                  <div className="h-4 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-1/2 rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="h-10 rounded bg-muted" />
                  <div className="h-10 rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-2xl font-semibold md:text-3xl">Features</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Multi-format questions','MCQ, True/False, Short answer, Cloze, Matching, Ordering.'],
            ['Timed quizzes','Auto-submit and score when time runs out.'],
            ['Smart feedback','AI-like remarks after scoring.'],
          ].map(([title,desc], i) => (
            <Card key={i}><CardContent className="p-6">
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{desc}</p>
            </CardContent></Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-2xl font-semibold md:text-3xl">How it works</h2>
        <ol className="mt-6 space-y-3 text-muted-foreground">
          <li>1. {user ? 'Open your dashboard' : 'Sign in'}.</li>
          <li>2. Create a quiz: title, duration, types, difficulty.</li>
          <li>3. Paste content or upload JSON.</li>
          <li>4. Generate & take the timed quiz.</li>
          <li>5. See score + feedback.</li>
        </ol>
        <div className="mt-8"><Button asChild><Link href={ctaHref}>Start now</Link></Button></div>
      </section>

       {/* FAQ */}
       <section id="faq" className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-2xl font-semibold md:text-3xl">FAQ</h2>
        <div className="mt-6 space-y-6">
          <div>
            <p className="font-medium">Do I need an account?</p>
            <p className="text-muted-foreground">
              You’ll sign in with a magic link to access your dashboard and saved quizzes.
            </p>
          </div>
          <div>
            <p className="font-medium">Can I mix question formats?</p>
            <p className="text-muted-foreground">
              Yes — pick any combination during creation.
            </p>
          </div>
          <div>
            <p className="font-medium">Will there be analytics?</p>
            <p className="text-muted-foreground">
              Basic scoring is built-in; deeper analytics can be added with Supabase later.
            </p>
          </div>
        </div>
      </section>

      {/* Contact / Footer */}
      <section id="contact" className="mx-auto max-w-6xl px-4 py-20">
        <Card>
          <CardContent className="p-6 md:p-8">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="text-xl font-semibold">Questions?</h3>
                <p className="text-muted-foreground mt-2">
                  We’d love to hear from you. Reach out and we’ll help you get set up fast.
                </p>
              </div>
              <div className="flex gap-3 md:justify-end">
                <Button asChild variant="outline">
                  <a href="mailto:hello@example.com">Email us</a>
                </Button>
                <Button asChild>
                  <Link href={ctaHref}>Go to {user ? "Dashboard" : "Sign in"}</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ / Footer trimmed for brevity */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} QuizCraft</span>
          <div className="flex gap-4">
            <a href="#features" className="hover:opacity-80">Features</a>
            <a href="#how" className="hover:opacity-80">How it works</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
