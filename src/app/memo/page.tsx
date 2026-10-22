import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWeek } from "@/lib/data";
import { addDays, mondayOf, todayISO, weekLabel } from "@/lib/dates";
import { Shell } from "@/components/Shell";
import { saveMemo } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function MemoPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  // The Sunday memo is for the week that starts tomorrow; default to next Monday on a Sunday, else this week.
  const today = todayISO();
  const defaultMonday = mondayOf(today) === today || new Date(today + "T12:00:00Z").getUTCDay() !== 0 ? mondayOf(today) : addDays(today, 1);
  const monday = mondayOf(/^\d{4}-\d{2}-\d{2}$/.test(sp.w || "") ? sp.w! : defaultMonday);
  const supabase = await createClient();
  const week = await getOrCreateWeek(supabase, monday);
  const { data: memos } = await supabase.from("memos").select("*").eq("week_id", week.id).order("created_at", { ascending: false });

  return (
    <Shell viewer={viewer} active="/memo">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Sunday memo</div>
          <h1 className="text-3xl font-semibold">Raw material for the week of {weekLabel(monday)}</h1>
          <p className="text-sm text-muted">Xavier writes it (or pastes the voice-memo transcript); the VA drafts from it; the AI plans from it.</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-outline btn-sm" href={`/memo?w=${addDays(monday, -7)}`}>← Prev week</Link>
          <Link className="btn btn-outline btn-sm" href={`/memo?w=${addDays(monday, 7)}`}>Next week →</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <form action={saveMemo} className="card p-4 lg:col-span-2">
          <input type="hidden" name="week_start" value={monday} />
          <label className="label">The five questions</label>
          <textarea
            name="body"
            className="textarea min-h-64"
            placeholder={`1. What did I build or ship this week? (one screenshot if possible)
2. What did a client or partner ask me that surprised me?
3. What annoyed me about how companies buy software this week?
4. Where was I, and one photo from there.
5. Anything coming up: a coffee, an event, a product update.`}
            required
          />
          <div className="mt-3 flex items-center gap-3">
            <button className="btn btn-primary">Save memo</button>
            <span className="text-xs text-muted">Posting as {viewer.role === "owner" ? "Xavier" : "VA"}. Then go to Week and generate the plan.</span>
          </div>
        </form>

        <aside className="space-y-3">
          <h2 className="text-lg font-semibold">Saved this week</h2>
          {(memos || []).length === 0 && <p className="card p-4 text-sm text-muted">No memo yet.</p>}
          {(memos || []).map((m) => (
            <div key={m.id} className="card p-4 text-sm">
              <div className="mb-1 text-xs text-muted">
                {m.author === "owner" ? "Xavier" : "VA"} · {new Date(m.created_at).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
              <p className="whitespace-pre-line">{m.body}</p>
            </div>
          ))}
        </aside>
      </div>
    </Shell>
  );
}
