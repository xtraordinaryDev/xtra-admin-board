import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getBrief } from "@/lib/data";
import { DEFAULT_BRIEF } from "@/lib/playbook";
import { Shell } from "@/components/Shell";
import { removeAllowedUser, saveSetting, upsertAllowedUser } from "@/app/actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const viewer = await requireOwner();
  const sp = await searchParams;
  const supabase = await createClient();
  const brief = await getBrief(supabase);
  const { data: users } = await supabase.from("allowed_users").select("*").order("role");

  return (
    <Shell viewer={viewer} active="/settings">
      <div className="mb-4">
        <div className="eyebrow">Settings</div>
        <h1 className="text-3xl font-semibold">The business, as the AI reads it</h1>
        <p className="text-sm text-muted">Change the brief when the offer, the audience or the proof changes. The weekly routine itself lives in code (src/lib/playbook.ts).</p>
      </div>

      {sp.saved && <div className="card mb-4 bg-gold-tint p-3 text-sm">Saved.</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <form action={saveSetting} className="card p-4 lg:col-span-2">
          <input type="hidden" name="key" value="brief" />
          <label className="label">Business brief</label>
          <textarea name="value" className="textarea min-h-[480px] font-mono text-xs" defaultValue={brief} />
          <div className="mt-3 flex items-center gap-3">
            <button className="btn btn-primary">Save brief</button>
            {brief !== DEFAULT_BRIEF && <span className="text-xs text-muted">Edited from the default. Clear the box and save to go back to it.</span>}
          </div>
        </form>

        <div className="space-y-6">
          <div className="card p-4">
            <h2 className="mb-2 font-semibold">Who can sign in</h2>
            <ul className="mb-3 space-y-2 text-sm">
              {(users || []).map((u) => (
                <li key={u.email} className="flex items-center justify-between gap-2">
                  <span>
                    {u.display_name || u.email} <span className="tag ml-1">{u.role}</span>
                    <div className="text-xs text-muted">{u.email}</div>
                  </span>
                  {u.email.toLowerCase() !== viewer.email.toLowerCase() && (
                    <form action={removeAllowedUser}>
                      <input type="hidden" name="email" value={u.email} />
                      <button className="text-xs text-danger underline">Remove</button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <form action={upsertAllowedUser} className="space-y-2">
              <input name="email" type="email" className="input" placeholder="assistant@email.com" required />
              <input name="display_name" className="input" placeholder="Display name" />
              <select name="role" className="select" defaultValue="va">
                <option value="va">VA</option>
                <option value="owner">Owner</option>
              </select>
              <button className="btn btn-outline w-full justify-center">Add or update</button>
            </form>
          </div>

          <div className="card p-4 text-sm text-muted">
            <h2 className="mb-2 font-semibold text-ink">Automatic plans</h2>
            Every Sunday at 6 p.m. Central the board drafts next week&apos;s plan on its own (Vercel cron). You review it on Monday morning, change what you want, and approve. The VA sees the routine straight away and the AI additions once approved.
          </div>
        </div>
      </div>
    </Shell>
  );
}
