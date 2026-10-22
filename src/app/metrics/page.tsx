import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWeek } from "@/lib/data";
import { addDays, mondayOf, todayISO, weekLabel } from "@/lib/dates";
import { METRIC_FIELDS } from "@/lib/playbook";
import { Shell } from "@/components/Shell";
import { saveMetrics } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function MetricsPage({ searchParams }: { searchParams: Promise<{ w?: string; saved?: string }> }) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const monday = mondayOf(/^\d{4}-\d{2}-\d{2}$/.test(sp.w || "") ? sp.w! : todayISO());
  const supabase = await createClient();
  const week = await getOrCreateWeek(supabase, monday);
  const { data: current } = await supabase.from("metrics").select("*").eq("week_id", week.id).maybeSingle();
  const { data: history } = await supabase
    .from("metrics")
    .select("*, weeks!inner(week_start)")
    .order("updated_at", { ascending: false })
    .limit(12);

  const rows = (history || [])
    .map((h) => ({ ...h, week_start: (h as { weeks: { week_start: string } }).weeks.week_start }))
    .sort((a, b) => (a.week_start < b.week_start ? 1 : -1));

  return (
    <Shell viewer={viewer} active="/metrics">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Friday report</div>
          <h1 className="text-3xl font-semibold">Week of {weekLabel(monday)}</h1>
          <p className="text-sm text-muted">Filled by the VA every Friday by 3 p.m. from Metricool, LinkedIn analytics and Pipeline. The AI reads it when it plans the next week.</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-outline btn-sm" href={`/metrics?w=${addDays(monday, -7)}`}>← Prev</Link>
          <Link className="btn btn-outline btn-sm" href="/metrics">This week</Link>
          <Link className="btn btn-outline btn-sm" href={`/metrics?w=${addDays(monday, 7)}`}>Next →</Link>
        </div>
      </div>

      {sp.saved && <div className="card mb-4 bg-gold-tint p-3 text-sm">Saved.</div>}

      <form action={saveMetrics} className="card mb-8 p-4">
        <input type="hidden" name="week_start" value={monday} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {METRIC_FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">
                {f.label}
                {f.weeklyTarget && <span className="ml-1 font-normal text-muted">(target {f.weeklyTarget})</span>}
              </label>
              <input name={f.key} type="number" className="input" defaultValue={(current as Record<string, number> | null)?.[f.key] ?? 0} />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <label className="label">One line of commentary (what the numbers say; the one thing to change)</label>
          <input name="notes" className="input" defaultValue={current?.notes || ""} />
        </div>
        <button className="btn btn-primary mt-3">Save the report</button>
      </form>

      <h2 className="mb-2 text-lg font-semibold">Last 12 weeks</h2>
      <div className="card overflow-x-auto p-2">
        <table className="data">
          <thead>
            <tr>
              <th>Week</th>
              <th>LI posts</th>
              <th>Impr.</th>
              <th>Views</th>
              <th>Req sent</th>
              <th>Accepted</th>
              <th>Convos</th>
              <th>Scorecards</th>
              <th>Coffees</th>
              <th>Calls</th>
              <th>Proposals</th>
              <th>Signed</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={13} className="text-muted">No reports yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.week_id}>
                <td><Link className="underline" href={`/metrics?w=${r.week_start}`}>{weekLabel(r.week_start)}</Link></td>
                <td>{r.posts_linkedin}</td>
                <td>{r.impressions}</td>
                <td>{r.profile_views}</td>
                <td>{r.requests_sent}</td>
                <td>{r.requests_accepted}</td>
                <td>{r.conversations}</td>
                <td>{r.scorecard_completions} / {r.scorecard_fits}</td>
                <td>{r.coffees}</td>
                <td>{r.first_calls}</td>
                <td>{r.proposals_sent}</td>
                <td>{r.assessments_signed}</td>
                <td className="max-w-xs text-muted">{r.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
