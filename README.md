# X-traordinary Board

The daily admin board for X-traordinary's marketing and sales. Two users, Xavier (owner) and the VA, one screen each morning. The weekly formula is fixed; an AI drafts the specifics every Sunday night from the memo, last week's numbers and the pipeline; Xavier approves or changes it; the VA works from it.

## What's on it

| Page | Who | What |
| --- | --- | --- |
| Today | both | the day's tasks for your lane, tick them off, carried-over tasks, the week's summary, the standing formula |
| Week | both | the seven-day board, both lanes; owner generates the AI plan (with notes), edits tasks, approves |
| Memo | both | the Sunday memo (the five questions); the AI and the VA draft from it |
| Pipeline | both | one row per buyer or partner: stage, next step, last touch, owner |
| Metrics | both | the Friday report, with weekly targets, and the last 12 weeks |
| Settings | owner | the business brief the AI reads; who can sign in |

The standing weekly routine (the posts by day, outbound counts, the Friday report, the Sunday memo) lives in `src/lib/playbook.ts` and is added to every new week automatically. The AI only adds specifics on top: post topics with first lines, who to message, which follow-ups are due, the one change the numbers call for, and at most four small tasks for Xavier.

## Deploy (about 15 minutes)

1. **Supabase**: the schema is already applied to the `X-traordinary Lead Gen` project (`sjqtbnssyzlsthvojdki`) and `x.thurman00@gmail.com` is seeded as owner. In the Supabase dashboard → Authentication → URL Configuration, set the Site URL to your Vercel URL and add `https://<your-vercel-domain>/auth/callback` to Redirect URLs. Under Authentication → Providers → Email, leave magic links on.
2. **Vercel**: import this repo, framework Next.js. Add the environment variables from `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://sjqtbnssyzlsthvojdki.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon key (Supabase → Project Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` = the service role key (same page; server-only, used by the Sunday cron)
   - `ANTHROPIC_API_KEY` = from console.anthropic.com
   - `ANTHROPIC_MODEL` = `claude-sonnet-5` (or any current Claude model id)
   - `CRON_SECRET` = any long random string (Vercel sends it to the cron route)
   - `NEXT_PUBLIC_SITE_URL` = your Vercel URL, e.g. `https://xtra-admin-board.vercel.app`
3. Deploy. Sign in at `/login` with your email; the magic link brings you back signed in.
4. **Add the VA**: Settings → Who can sign in → her email, role VA. She signs in the same way.
5. The cron in `vercel.json` runs Sundays at 23:00 UTC (6 p.m. Central) and drafts next week. You can also generate any week by hand on the Week page.

## Local development

```
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```

Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` locally and add `http://localhost:3000/auth/callback` to Supabase's redirect URLs.

## How the week runs

- **Sunday**: Xavier saves the memo (Memo page) and films one video. At 6 p.m. the board drafts next week. The VA drafts posts from the memo by 9 p.m.
- **Monday**: Xavier opens Week, reads the summary, changes what he wants (notes + Regenerate, or edit tasks directly), and taps Approve. Ten minutes.
- **Every day**: each of you opens Today and works the list.
- **Friday**: the VA fills Metrics by 3 p.m. Those numbers feed the next plan.

## Changing the formula

Edit `ROUTINE` and `DEFAULT_BRIEF` in `src/lib/playbook.ts` for permanent changes (the brief can also be edited live in Settings). The AI prompt is in `src/lib/ai.ts`.
