import Link from "next/link";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PipelineRow } from "@/lib/data";
import { STAGE_LABEL } from "@/lib/playbook";
import { Shell } from "@/components/Shell";
import { deletePipeline, upsertPipeline } from "@/app/actions";

export const dynamic = "force-dynamic";

const STAGES = Object.keys(STAGE_LABEL);
const SOURCES = ["outbound", "scorecard", "partner", "event", "referral", "other"];

export default async function PipelinePage({ searchParams }: { searchParams: Promise<{ edit?: string; show?: string }> }) {
  const viewer = await requireViewer();
  const sp = await searchParams;
  const supabase = await createClient();
  let q = supabase.from("pipeline").select("*").order("updated_at", { ascending: false });
  if (sp.show !== "all") q = q.not("stage", "in", "(retained,lost)");
  const { data } = await q.limit(300);
  const rows = (data || []) as PipelineRow[];
  const editing = rows.find((r) => r.id === sp.edit) || (sp.edit ? ((await supabase.from("pipeline").select("*").eq("id", sp.edit).maybeSingle()).data as PipelineRow | null) : null);

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.stage] = (counts[r.stage] || 0) + 1;

  return (
    <Shell viewer={viewer} active="/pipeline">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="eyebrow">Pipeline</div>
          <h1 className="text-3xl font-semibold">Every person we&apos;re talking to</h1>
          <p className="text-sm text-muted">One row per buyer or partner. Every row has a stage, a last touch and a next step. The AI plans follow-ups from here.</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-outline btn-sm" href={sp.show === "all" ? "/pipeline" : "/pipeline?show=all"}>
            {sp.show === "all" ? "Hide closed" : "Show retained and lost"}
          </Link>
          <Link className="btn btn-primary btn-sm" href="/pipeline?edit=new">Add a person</Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {STAGES.map((s) => (
          <span key={s} className="tag">{STAGE_LABEL[s]}: {counts[s] || 0}</span>
        ))}
      </div>

      {(sp.edit === "new" || editing) && (
        <form action={upsertPipeline} className="card mb-6 grid gap-3 p-4 sm:grid-cols-6">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div className="sm:col-span-2">
            <label className="label">Name</label>
            <input name="name" className="input" required defaultValue={editing?.name || ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Company</label>
            <input name="company" className="input" defaultValue={editing?.company || ""} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Title</label>
            <input name="title" className="input" defaultValue={editing?.title || ""} />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="kind" className="select" defaultValue={editing?.kind || "buyer"}>
              <option value="buyer">Buyer</option>
              <option value="partner">Partner</option>
            </select>
          </div>
          <div>
            <label className="label">Source</label>
            <select name="source" className="select" defaultValue={editing?.source || "outbound"}>
              {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Stage</label>
            <select name="stage" className="select" defaultValue={editing?.stage || "new"}>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Owner</label>
            <select name="owner" className="select" defaultValue={editing?.owner || "va"}>
              <option value="va">VA</option>
              <option value="owner">Xavier</option>
            </select>
          </div>
          <div>
            <label className="label">Last touch</label>
            <input name="last_touch" type="date" className="input" defaultValue={editing?.last_touch || ""} />
          </div>
          <div>
            <label className="label">LinkedIn URL</label>
            <input name="linkedin_url" className="input" defaultValue={editing?.linkedin_url || ""} />
          </div>
          <div className="sm:col-span-3">
            <label className="label">Next step</label>
            <input name="next_step" className="input" defaultValue={editing?.next_step || ""} placeholder="e.g. day-7 follow-up Thu; send partner one-pager" />
          </div>
          <div className="sm:col-span-3">
            <label className="label">Notes</label>
            <input name="notes" className="input" defaultValue={editing?.notes || ""} />
          </div>
          <div className="sm:col-span-6 flex gap-2">
            <button className="btn btn-primary">Save</button>
            <Link href="/pipeline" className="btn btn-outline">Cancel</Link>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto p-2">
        <table className="data">
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Type</th>
              <th>Stage</th>
              <th>Next step</th>
              <th>Last touch</th>
              <th>Owner</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={8} className="text-muted">Empty. Start with the ten MSPs and the first 15 buyer names.</td></tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="font-semibold">{r.linkedin_url ? <a className="underline" href={r.linkedin_url} target="_blank" rel="noreferrer">{r.name}</a> : r.name}</div>
                  <div className="text-xs text-muted">{r.title}</div>
                </td>
                <td>{r.company}</td>
                <td><span className={`tag ${r.kind === "partner" ? "tag-gold" : ""}`}>{r.kind}</span></td>
                <td>{STAGE_LABEL[r.stage] || r.stage}</td>
                <td className="max-w-xs">{r.next_step}</td>
                <td>{r.last_touch || <span className="text-warning">never</span>}</td>
                <td>{r.owner === "owner" ? "Xavier" : "VA"}</td>
                <td className="whitespace-nowrap text-xs">
                  <Link href={`/pipeline?edit=${r.id}${sp.show === "all" ? "&show=all" : ""}`} className="mr-2 underline">Edit</Link>
                  <form action={deletePipeline} className="inline">
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-danger underline">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
