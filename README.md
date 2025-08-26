# AI Quiz Builder (Next.js + Supabase + Gemini)

Create, take, and manage AI-generated quizzes. Users define quiz settings (title, duration, difficulty, formats, count, and optional instructions/source text); the app calls **Gemini (OpenAI-compat)** to generate questions, stores them in **Supabase**, and provides a timed test runner with scoring and AI feedback.

## Features
- 🔐 **Auth**: Supabase email + password (middleware-protected dashboard)
- 🧠 **AI generation**: Gemini via OpenAI-compatible API (JS SDK)
- 🗂️ **Quiz storage**: `quizzes` table with `questions` (`jsonb`), `formats` (`text[]`), `feedback`
- ⏱️ **Timed test runner**: multiple formats (MCQ, T/F, short answer, cloze, matching, ordering)
- 📝 **Attempts**: scores + AI **remarks** saved in `attempts`
- ♻️ **Duplicate quiz** (new questions) & **Delete** quiz (cascades attempts)
- ✍️ **Edit quiz** with optional **regeneration**
- 🧭 **SourceTextBox** with live length/token meter & warnings
- 🧩 **shadcn/ui** + Tailwind UI components

---

## Tech Stack
- **Next.js (App Router), Server Actions**
- **Supabase** (Auth, Postgres, RLS)
- **Gemini** (OpenAI-compat via `openai` SDK)
- **Tailwind CSS**, **shadcn/ui**, **lucide-react**
- **JSON5** (tolerant parsing of model output)

---

## Quick Start

### 1) Prerequisites
- Node 18+ (or 20+ recommended)
- A Supabase project (URL + anon key)
- A Google AI Studio API key (Gemini)

### 2) Environment
Create `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_key
# Optional: pick the model you prefer
GEMINI_MODEL=gemini-2.5-flash
```

### 3) Install & Run
```bash
npm install
npm run dev
```
Visit `http://localhost:3000`.

---

## Database (Supabase)

Run this SQL in the **SQL Editor** (safe to re-run, idempotent):

```sql
create extension if not exists pgcrypto;

-- QUIZZES
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  duration_seconds integer not null default 600 check (duration_seconds > 0),
  difficulty text not null default 'standard' check (difficulty in ('easy','standard','advanced')),
  formats text[] not null default array['multiple_choice','true_false','short_answer','cloze','matching','ordering'],
  questions jsonb not null default '[]'::jsonb,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quizzes_questions_is_array check (jsonb_typeof(questions) = 'array')
);
create index if not exists idx_quizzes_owner on public.quizzes(owner_id);
alter table public.quizzes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quizzes' and policyname='owner select') then
    create policy "owner select" on public.quizzes for select using (owner_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quizzes' and policyname='owner insert') then
    create policy "owner insert" on public.quizzes for insert with check (owner_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quizzes' and policyname='owner update') then
    create policy "owner update" on public.quizzes for update using (owner_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quizzes' and policyname='owner delete') then
    create policy "owner delete" on public.quizzes for delete using (owner_id = auth.uid());
  end if;
end$$;

-- ATTEMPTS
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score >= 0),
  total integer not null check (total > 0),
  remark text,
  created_at timestamptz not null default now()
);
create index if not exists idx_attempts_user on public.attempts(user_id);
create index if not exists idx_attempts_quiz on public.attempts(quiz_id);
alter table public.attempts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='attempts' and policyname='attempt visible to taker') then
    create policy "attempt visible to taker" on public.attempts for select using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='attempts' and policyname='attempt insert by taker') then
    create policy "attempt insert by taker" on public.attempts for insert with check (user_id = auth.uid());
  end if;
end$$;
```

---

## Project Structure (key files)
```
app/
  page.jsx                      # Landing page (shadcn + Tailwind)
  error.js                      # Global error UI
  auth/                         # Login/Register (Supabase email/password)
  dashboard/
    actions.js                  # deleteQuizAction, duplicateQuizAction
    page.jsx                    # List user quizzes + actions
    _components/QuizCardActions.jsx
    quizzes/
      new/page.jsx              # Create quiz + AI generation
      [id]/page.jsx             # Server fetch -> client runner
      [id]/take-quiz.jsx        # Timed runner + scoring + saveAttempt
      [id]/edit/page.jsx        # Edit metadata + (optional) regenerate
lib/
  ai/generate-questions.js      # Gemini via OpenAI-compat; JSON5 parsing
  ai/generate-remark.js         # Gemini remark generator
utils/supabase/
  client.js server.js middleware.js   # Your Supabase helpers
components/
  PendingSubmit.jsx             # Client submit button with useFormStatus
  SubmitButton.jsx              # (new quiz) spinner button
  FormPendingFieldset.jsx
  FormPendingOverlay.jsx
  SourceTextBox.jsx             # Live token/length warnings
```

---

## How It Works

### Generate questions
- **Form settings**: title, description, difficulty, formats, duration, **count**, and **source/instructions**.
- Server Action calls `generate-questions.js`:
  - Uses **OpenAI SDK** pointing to Gemini’s **OpenAI-compat** base URL.
  - Requests strict JSON; parses with **JSON5** fallback and light repairs.
  - Enforces a **count clamp (1–20)** and normalizes each item to:
    ```json
    {
      "question": "string",
      "type": "multiple_choice | true_false | short_answer | cloze | matching | ordering",
      "options": [],
      "answers": [],
      "explanation": "optional"
    }
    ```
- Saved into `quizzes.questions` (jsonb).

### Take quiz & score
- Client runner shows timer, supports all formats, and lets you **cancel** back to dashboard.
- On submit: local scoring → calls `saveAttemptAction` to store **score/total** and AI **remark**.

### Edit & duplicate
- **Edit** updates metadata or **regenerates** questions (optional instructions + count).
- **Duplicate** creates a new quiz with freshly generated questions.

---

## Configuration Notes
- **Auth**: Supabase email/password (magic link disabled).
- **RLS**: Owner-only access on `quizzes`; attempts visible/insertable only by the taker.
- **Gemini**: API key & model in `.env.local`. No extra base URL env—handled in code.
- **Token limits**: **SourceTextBox** shows a rough token estimate; long inputs can truncate.

---

## Troubleshooting
- **`useFormStatus is not a function`** → Components using it must be in a client file with `'use client'`.
- **“Each child in a list should have a unique key”** → Ensure list items have stable `key`s (we use `qid`).
- **JSON parse errors from AI** → Ensure `json5` is installed. Our parser already heals common issues.
- **RLS violations** → Inserts must include `owner_id = auth.uid()`; follow the server action patterns.

---

## Scripts
```bash
npm run dev       # start locally
npm run build     # production build
npm start         # run production server
```

---

## Security & Privacy
- Don’t paste secrets into **SourceTextBox**—it’s sent to the model provider.
- Supabase RLS prevents cross-user access to quizzes/attempts.
- Consider rate limiting/captcha if you open this publicly.

---

## Roadmap
- Export quiz as `.json`
- Toast notifications for actions
- Archive (soft delete) instead of hard delete
- URL/PDF import for source text
- Per-question manual editor

---

## License
Released under the **MIT License**. See `LICENSE`.
