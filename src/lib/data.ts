import type { SupabaseClient } from "@supabase/supabase-js";
import { ROUTINE, DEFAULT_BRIEF } from "@/lib/playbook";
import { addDays, weekDays } from "@/lib/dates";
import { generatePlan, type PlanContext } from "@/lib/ai";

export type Week = {
  id: string;
  week_start: string;
  status: "draft" | "approved";
  summary: string;
  owner_notes: string;
  generated_at: string | null;
  approved_at: string | null;
};

export type Task = {
  id: string;
  week_id: string;
  assignee: "owner" | "va";
  day: string;
  sort: number;
  title: string;
  detail: string;
  kind: string;
  pillar: string | null;
  channel: string | null;
  status: "todo" | "done" | "skipped";
  source: "ai" | "routine" | "manual";
  done_at: string | null;
};

export type PipelineRow = {
  id: string;
  name: string;
  company: string;
  title: string;
  kind: "buyer" | "partner";
  source: string;
  stage: string;
  next_step: string;
  owner: "owner" | "va";
  linkedin_url: string;
  last_touch: string | null;
  notes: string;
};

/** Returns the week row for a Monday, creating it (with the standing routine) if needed. */
export async function getOrCreateWeek(db: SupabaseClient, monday: string): Promise<Week> {
  const { data: existing } = await db.from("weeks").select("*").eq("week_start", monday).maybeSingle();
  if (existing) return existing as Week;

  const { data: created, error } = await db
    .from("weeks")
    .insert({ week_start: monday })
    .select("*")
    .single();
  if (error || !created) {
    // Another request may have created it in between.
    const { data: again } = await db.from("weeks").select("*").eq("week_start", monday).single();
    if (!again) throw new Error(error?.message || "Could not create the week.");
    return again as Week;
  }

  const days = weekDays(monday);
  const routineRows = ROUTINE.map((r, i) => ({
    week_id: created.id,
    assignee: r.assignee,
    day: days[r.weekday],
    sort: i,
    title: r.title,
    detail: r.detail,
    kind: r.kind,
    pillar: r.pillar ?? null,
    channel: r.channel ?? null,
    source: "routine",
  }));
  await db.from("tasks").insert(routineRows);
  return created as Week;
}

export async function getTasks(db: SupabaseClient, weekId: string): Promise<Task[]> {
  const { data } = await db
    .from("tasks")
    .select("*")
    .eq("week_id", weekId)
    .order("day")
    .order("assignee")
    .order("sort");
  return (data || []) as Task[];
}

export async function getSetting(db: SupabaseClient, key: string): Promise<string | null> {
  const { data } = await db.from("settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

export async function getBrief(db: SupabaseClient): Promise<string> {
  return (await getSetting(db, "brief")) || DEFAULT_BRIEF;
}

/** Gathers context, asks the model, and replaces the week's AI tasks. Routine and manual tasks stay. */
export async function buildPlan(db: SupabaseClient, monday: string, ownerNotes?: string): Promise<Week> {
  const week = await getOrCreateWeek(db, monday);
  const prevMonday = addDays(monday, -7);

  const [brief, memoRes, prevWeekRes, pipelineRes, draftTasks] = await Promise.all([
    getBrief(db),
    db.from("memos").select("body").eq("week_id", week.id).order("created_at", { ascending: false }).limit(3),
    db.from("weeks").select("id, week_start").eq("week_start", prevMonday).maybeSingle(),
    db
      .from("pipeline")
      .select("name, company, kind, stage, next_step, last_touch")
      .not("stage", "in", "(retained,lost)")
      .order("updated_at", { ascending: false })
      .limit(40),
    getTasks(db, week.id),
  ]);

  let lastWeek: PlanContext["lastWeek"] = null;
  if (prevWeekRes.data) {
    const [m, t] = await Promise.all([
      db.from("metrics").select("*").eq("week_id", prevWeekRes.data.id).maybeSingle(),
      getTasks(db, prevWeekRes.data.id),
    ]);
    const metrics = m.data ? { ...m.data } : null;
    if (metrics) {
      delete (metrics as Record<string, unknown>).week_id;
      delete (metrics as Record<string, unknown>).updated_at;
    }
    lastWeek = {
      weekStart: prevWeekRes.data.week_start,
      metrics: metrics as Record<string, number | string> | null,
      done: t.filter((x) => x.status === "done").map((x) => `${x.assignee}: ${x.title}`),
      notDone: t.filter((x) => x.status === "todo").map((x) => `${x.assignee}: ${x.title}`),
    };
  }

  const memo = (memoRes.data || []).map((m) => m.body).join("\n\n") || null;
  const notes = ownerNotes ?? week.owner_notes;

  const plan = await generatePlan({
    weekStart: monday,
    brief,
    memo,
    ownerNotes: notes,
    lastWeek,
    pipeline: (pipelineRes.data || []) as PlanContext["pipeline"],
    existingDraft: draftTasks.filter((t) => t.source === "ai").map((t) => ({ assignee: t.assignee, day: t.day, title: t.title })),
  });

  // Replace the AI tasks; keep routine and manual ones and their status.
  await db.from("tasks").delete().eq("week_id", week.id).eq("source", "ai");
  const base = 1000;
  const rows = plan.tasks.map((t, i) => ({
    week_id: week.id,
    assignee: t.assignee,
    day: t.day,
    sort: base + i,
    title: t.title.slice(0, 200),
    detail: t.detail || "",
    kind: t.kind,
    pillar: t.pillar ?? null,
    channel: t.channel ?? null,
    source: "ai",
  }));
  if (rows.length) await db.from("tasks").insert(rows);

  const { data: updated } = await db
    .from("weeks")
    .update({
      summary: plan.summary,
      owner_notes: notes || "",
      generated_at: new Date().toISOString(),
      status: "draft",
      approved_at: null,
    })
    .eq("id", week.id)
    .select("*")
    .single();
  return (updated || week) as Week;
}
