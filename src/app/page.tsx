import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateWeek, getTasks } from "@/lib/data";
import { addDays, dayLabel, mondayOf, todayISO, weekLabel } from "@/lib/dates";
import { Shell } from "@/components/Shell";
import { TaskItem } from "@/components/TaskItem";
import { addTask } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ d?: string; as?: string }> }) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const today = todayISO();
  const day = /^\d{4}-\d{2}-\d{2}$/.test(sp.d || "") ? sp.d! : today;
  const lane: "owner" | "va" = viewer.role === "owner" ? (sp.as === "va" ? "va" : "owner") : "va";

  const supabase = await createClient();
  const week = await getOrCreateWeek(supabase, mondayOf(day));
  const all = await getTasks(supabase, week.id);
  const mine = all.filter((t) => t.assignee === lane);
  const todays = mine.filter((t) => t.day === day);
  const overdue = mine.filter((t) => t.day < day && t.status === "todo");
  const upcoming = mine.filter((t) => t.day > day).slice(0, 8);
  const doneCount = mine.filter((t) => t.status === "done").length;

  const draftForVA = viewer.role === "va" && week.status !== "approved";

  return (
    <Shell viewer={viewer} active="/">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">{day === today ? "Today" : "Day"}</div>
          <h1 className="text-3xl font-semibold">{dayLabel(day, "long")}</h1>
          <p className="text-sm text-muted">
            Week of {weekLabel(week.week_start)} ·{" "}
            <span className={week.status === "approved" ? "text-success" : "text-warning"}>
              {week.status === "approved" ? "plan approved" : "plan in draft"}
            </span>{" "}
            · {doneCount}/{mine.length} done this week
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link className="btn btn-outline btn-sm" href={`/?d=${addDays(day, -1)}${lane === "va" && viewer.role === "owner" ? "&as=va" : ""}`}>← Prev</Link>
          <Link className="btn btn-outline btn-sm" href={`/${lane === "va" && viewer.role === "owner" ? "?as=va" : ""}`}>Today</Link>
          <Link className="btn btn-outline btn-sm" href={`/?d=${addDays(day, 1)}${lane === "va" && viewer.role === "owner" ? "&as=va" : ""}`}>Next →</Link>
          {viewer.role === "owner" && (
            <Link className="btn btn-dark btn-sm" href={lane === "owner" ? `/?d=${day}&as=va` : `/?d=${day}`}>
              {lane === "owner" ? "View the VA's day" : "Back to my day"}
            </Link>
          )}
        </div>
      </div>

      {draftForVA && (
        <div className="card mb-4 border-warning/40 bg-gold-tint p-4 text-sm">
          This week&apos;s plan hasn&apos;t been approved yet. The standing routine below always applies; the AI-added tasks may still change.
        </div>
      )}

      {week.summary && (
        <div className="card mb-4 p-4">
          <div className="eyebrow mb-1">This week</div>
          <p className="text-sm">{week.summary}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-2 text-lg font-semibold">{lane === "owner" ? "Xavier's" : "The VA's"} tasks for the day</h2>
          <div className="card px-4">
            {todays.length === 0 ? (
              <p className="py-6 text-sm text-muted">Nothing scheduled. Add something below or check the week.</p>
            ) : (
              <ul>
                {todays.map((t) => (
                  <TaskItem key={t.id} task={t} canEdit={viewer.role === "owner"} />
                ))}
              </ul>
            )}
          </div>

          {overdue.length > 0 && (
            <>
              <h2 className="mb-2 mt-6 text-lg font-semibold text-warning">Carried over (not done earlier this week)</h2>
              <div className="card px-4">
                <ul>
                  {overdue.map((t) => (
                    <TaskItem key={t.id} task={t} canEdit={viewer.role === "owner"} />
                  ))}
                </ul>
              </div>
            </>
          )}

          <form action={addTask} className="card mt-6 grid gap-3 p-4 sm:grid-cols-6">
            <input type="hidden" name="day" value={day} />
            {viewer.role === "owner" && <input type="hidden" name="assignee" value={lane} />}
            <div className="sm:col-span-4">
              <label className="label">Add a task for this day</label>
              <input name="title" className="input" placeholder="What has to happen" required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Kind</label>
              <select name="kind" className="select" defaultValue="other">
                {["post", "engage", "outbound", "partner", "call", "build", "report", "admin", "other"].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-5">
              <input name="detail" className="input" placeholder="Detail (optional)" />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <button className="btn btn-primary w-full justify-center">Add</button>
            </div>
          </form>
        </section>

        <aside>
          <h2 className="mb-2 text-lg font-semibold">Coming up</h2>
          <div className="card p-4 text-sm">
            {upcoming.length === 0 ? (
              <p className="text-muted">Nothing else this week.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((t) => (
                  <li key={t.id} className="flex gap-2">
                    <span className="w-16 shrink-0 text-muted">{dayLabel(t.day)}</span>
                    <span className={t.status === "done" ? "text-muted line-through" : ""}>{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={`/week?w=${week.week_start}`} className="mt-3 inline-block text-gold-deep underline">
              Open the whole week
            </Link>
          </div>

          <h2 className="mb-2 mt-6 text-lg font-semibold">The formula</h2>
          <div className="card p-4 text-sm text-muted">
            {lane === "va" ? (
              <ul className="list-disc space-y-1 pl-4">
                <li>Mon Proof post · Wed Teach post + reel · Thu Lifestyle · Fri POV or Partners.</li>
                <li>15 connection requests a day from Xavier&apos;s account, by hand. Log every one in Pipeline.</li>
                <li>Tuesday: 10 thoughtful comments. Thursday: four partner messages.</li>
                <li>Friday 3 p.m.: the Metrics page, with one line of commentary.</li>
                <li>Sunday 9 p.m.: next week&apos;s drafts from the memo.</li>
                <li>Any reply from a buyer or partner goes to Xavier the same day.</li>
              </ul>
            ) : (
              <ul className="list-disc space-y-1 pl-4">
                <li>Sunday: 10-minute memo + one 60-second video.</li>
                <li>Monday: 10 minutes approving drafts.</li>
                <li>One partner coffee a week. One first call per introduction.</li>
                <li>Every buyer or partner reply answered within 24 hours, by you.</li>
                <li>Friday: read the report. Coffees held and assessments sold are the two numbers.</li>
                <li>Nothing else. The VA runs the rest.</li>
              </ul>
            )}
          </div>
        </aside>
      </div>
    </Shell>
  );
}
