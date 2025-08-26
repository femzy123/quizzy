# Third-Party Notices

This project includes open-source software developed by third parties. This document lists the primary
dependencies and their licenses. For a complete inventory, please follow the **Auto-generated inventory**
instructions below.

_Last updated: 2025-08-26_

---

## Primary, hand-curated dependencies

> Update this list to reflect your actual `package.json`.

| Package                       | License    | Notes                                   |
|------------------------------|------------|-----------------------------------------|
| next                         | MIT        | Next.js framework                       |
| react, react-dom             | MIT        | React runtime                           |
| tailwindcss                  | MIT        | Utility-first CSS                       |
| @supabase/supabase-js        | Apache-2.0 | Supabase client                         |
| lucide-react                 | ISC        | Icons                                   |
| shadcn/ui (templates)        | MIT        | Component templates (uses Radix UI etc.)|
| openai/gemini ai             | MIT        | OpenAI SDK used with Gemini compat API  |
| json5                        | MIT        | Robust JSON parsing                     |

> Note: Some shadcn/ui components vendored into your code may pull in additional packages
> (e.g., `@radix-ui/*`, `class-variance-authority`, `tailwind-merge`). See the full inventory below.

---

## Auto-generated inventory (recommended)

Use one of the commands below to export an authoritative list of **all** production dependencies with their licenses.

### CSV
npx license-checker --production --csv > THIRD_PARTY_LICENSES.csv

### JSON
npx license-checker --production --json > THIRD_PARTY_LICENSES.json

### Human-readable summary
npx license-checker --production --summary

> If `license-checker` is not installed, the `npx` invocation will fetch it on demand.
> Review the output files into your repo (e.g., `/legal/` folder) as part of your release process.

---

## Notices for Apache-2.0 and others

Some dependencies (e.g., `@supabase/supabase-js`) are licensed under **Apache-2.0** which may require
including their NOTICE text in your distribution. If the tool surfaces a `NOTICE` field or file for a package,
copy it into a `THIRD_PARTY_NOTICE_APPENDIX.md` and reference it here.

---

## Disclaimer

This document is provided as a convenience and may be incomplete. Always check each dependency’s repository
for the authoritative license and any additional obligations.
