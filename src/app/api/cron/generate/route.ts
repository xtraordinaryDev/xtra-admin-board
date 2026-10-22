import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { buildPlan } from "@/lib/data";
import { addDays, mondayOf, todayISO } from "@/lib/dates";

/**
 * Vercel Cron hits this every Sunday evening (see vercel.json) and the board
 * drafts next week's plan. Needs CRON_SECRET and SUPABASE_SERVICE_ROLE_KEY in
 * the environment; the service-role key is used because no user is signed in.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization") || "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });

  const db = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  });

  const today = todayISO();
  const dow = new Date(today + "T12:00:00Z").getUTCDay();
  const nextMonday = dow === 0 ? addDays(today, 1) : addDays(mondayOf(today), 7);

  try {
    const week = await buildPlan(db, nextMonday);
    return NextResponse.json({ ok: true, week: week.week_start, status: week.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
