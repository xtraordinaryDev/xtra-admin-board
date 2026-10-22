"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireOwner, requireViewer } from "@/lib/auth";
import { buildPlan, getOrCreateWeek } from "@/lib/data";
import { mondayOf } from "@/lib/dates";

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

// ---------- auth ----------

export async function sendMagicLink(fd: FormData): Promise<void> {
  const email = str(fd, "email").toLowerCase();
  if (!email) redirect("/login?error=Enter+your+email");
  const supabase = await createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${site}/auth/callback`, shouldCreateUser: true },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect("/login?sent=1");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- tasks ----------

export async function setTaskStatus(fd: FormData): Promise<void> {
  await requireViewer();
  const supabase = await createClient();
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!id || !["todo", "done", "skipped"].includes(status)) return;
  await supabase
    .from("tasks")
    .update({ status, done_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/");
  revalidatePath("/week");
}

export async function addTask(fd: FormData): Promise<void> {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const day = str(fd, "day");
  const title = str(fd, "title");
  if (!day || !title) return;
  const assignee = viewer.role === "owner" ? str(fd, "assignee") || "owner" : "va";
  const week = await getOrCreateWeek(supabase, mondayOf(day));
  await supabase.from("tasks").insert({
    week_id: week.id,
    assignee,
    day,
    sort: 5000 + Math.floor(Date.now() / 1000) % 100000,
    title: title.slice(0, 200),
    detail: str(fd, "detail"),
    kind: str(fd, "kind") || "other",
    source: "manual",
  });
  revalidatePath("/");
  revalidatePath("/week");
}

export async function updateTask(fd: FormData): Promise<void> {
  await requireOwner();
  const supabase = await createClient();
  const id = str(fd, "id");
  if (!id) return;
  const patch: Record<string, string> = {};
  for (const k of ["title", "detail", "day", "assignee", "kind"]) {
    const v = str(fd, k);
    if (v) patch[k] = v;
  }
  await supabase.from("tasks").update(patch).eq("id", id);
  revalidatePath("/week");
  revalidatePath("/");
}

export async function deleteTask(fd: FormData): Promise<void> {
  await requireOwner();
  const supabase = await createClient();
  const id = str(fd, "id");
  if (id) await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/week");
  revalidatePath("/");
}

// ---------- weeks ----------

export async function generateWeek(fd: FormData): Promise<void> {
  await requireOwner();
  const supabase = await createClient();
  const monday = mondayOf(str(fd, "week_start"));
  const notes = str(fd, "owner_notes");
  try {
    await buildPlan(supabase, monday, notes);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Plan generation failed.";
    redirect(`/week?w=${monday}&error=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/week");
  revalidatePath("/");
  redirect(`/week?w=${monday}`);
}

export async function approveWeek(fd: FormData): Promise<void> {
  await requireOwner();
  const supabase = await createClient();
  const monday = mondayOf(str(fd, "week_start"));
  const week = await getOrCreateWeek(supabase, monday);
  await supabase
    .from("weeks")
    .update({ status: "approved", approved_at: new Date().toISOString() })
    .eq("id", week.id);
  revalidatePath("/week");
  revalidatePath("/");
}

export async function unapproveWeek(fd: FormData): Promise<void> {
  await requireOwner();
  const supabase = await createClient();
  const monday = mondayOf(str(fd, "week_start"));
  const week = await getOrCreateWeek(supabase, monday);
  await supabase.from("weeks").update({ status: "draft", approved_at: null }).eq("id", week.id);
  revalidatePath("/week");
  revalidatePath("/");
}

export async function saveSummary(fd: FormData): Promise<void> {
  await requireOwner();
  const supabase = await createClient();
  const monday = mondayOf(str(fd, "week_start"));
  const week = await getOrCreateWeek(supabase, monday);
  await supabase.from("weeks").update({ summary: str(fd, "summary") }).eq("id", week.id);
  revalidatePath("/week");
  revalidatePath("/");
}

// ---------- memo ----------

export async function saveMemo(fd: FormData): Promise<void> {
  const viewer = await requireViewer();
  const supabase = await createClient();
  const body = str(fd, "body");
  const monday = mondayOf(str(fd, "week_start"));
  if (!body) return;
  const week = await getOrCreateWeek(supabase, monday);
  await supabase.from("memos").insert({ week_id: week.id, author: viewer.role, body });
  revalidatePath("/memo");
  redirect(`/memo?w=${monday}`);
}

// ---------- metrics ----------

export async function saveMetrics(fd: FormData): Promise<void> {
  await requireViewer();
  const supabase = await createClient();
  const monday = mondayOf(str(fd, "week_start"));
  const week = await getOrCreateWeek(supabase, monday);
  const row: Record<string, number | string> = { week_id: week.id, updated_at: new Date().toISOString() };
  for (const [k, v] of fd.entries()) {
    if (k === "week_start" || k === "notes" || typeof v !== "string") continue;
    const n = parseInt(v.replace(/[^0-9-]/g, ""), 10);
    row[k] = Number.isFinite(n) ? n : 0;
  }
  row.notes = str(fd, "notes");
  await supabase.from("metrics").upsert(row, { onConflict: "week_id" });
  revalidatePath("/metrics");
  redirect(`/metrics?w=${monday}&saved=1`);
}

// ---------- pipeline ----------

export async function upsertPipeline(fd: FormData): Promise<void> {
  await requireViewer();
  const supabase = await createClient();
  const id = str(fd, "id");
  const row: Record<string, string | null> = {
    name: str(fd, "name"),
    company: str(fd, "company"),
    title: str(fd, "title"),
    kind: str(fd, "kind") || "buyer",
    source: str(fd, "source") || "outbound",
    stage: str(fd, "stage") || "new",
    next_step: str(fd, "next_step"),
    owner: str(fd, "owner") || "va",
    linkedin_url: str(fd, "linkedin_url"),
    last_touch: str(fd, "last_touch") || null,
    notes: str(fd, "notes"),
    updated_at: new Date().toISOString(),
  };
  if (!row.name) return;
  if (id) await supabase.from("pipeline").update(row).eq("id", id);
  else await supabase.from("pipeline").insert(row);
  revalidatePath("/pipeline");
  redirect("/pipeline");
}

export async function deletePipeline(fd: FormData): Promise<void> {
  await requireViewer();
  const supabase = await createClient();
  const id = str(fd, "id");
  if (id) await supabase.from("pipeline").delete().eq("id", id);
  revalidatePath("/pipeline");
}

// ---------- settings ----------

export async function saveSetting(fd: FormData): Promise<void> {
  await requireOwner();
  const supabase = await createClient();
  const key = str(fd, "key");
  if (!key) return;
  await supabase
    .from("settings")
    .upsert({ key, value: str(fd, "value"), updated_at: new Date().toISOString() }, { onConflict: "key" });
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function upsertAllowedUser(fd: FormData): Promise<void> {
  await requireOwner();
  const supabase = await createClient();
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role") === "owner" ? "owner" : "va";
  if (!email) return;
  await supabase
    .from("allowed_users")
    .upsert({ email, role, display_name: str(fd, "display_name") }, { onConflict: "email" });
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function removeAllowedUser(fd: FormData): Promise<void> {
  const owner = await requireOwner();
  const supabase = await createClient();
  const email = str(fd, "email").toLowerCase();
  if (!email || email === owner.email.toLowerCase()) return;
  await supabase.from("allowed_users").delete().eq("email", email);
  revalidatePath("/settings");
}
