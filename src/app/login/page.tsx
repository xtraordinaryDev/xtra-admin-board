import { sendMagicLink } from "@/app/actions";
import { Mark } from "@/components/Shell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; denied?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-lg bg-dark p-2">
            <Mark size={28} />
          </span>
          <div>
            <div className="wordmark text-sm text-ink">X-traordinary</div>
            <div className="text-xs text-muted">Daily board</div>
          </div>
        </div>
        {sp.sent ? (
          <p className="text-sm">
            Check your email for the sign-in link. It works once and expires in an hour.
          </p>
        ) : (
          <form action={sendMagicLink} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">
                Work email
              </label>
              <input id="email" name="email" type="email" required className="input" placeholder="you@company.com" />
            </div>
            <button className="btn btn-primary w-full justify-center">Email me a sign-in link</button>
            {sp.denied && <p className="text-sm text-danger">That email isn&apos;t on the board&apos;s allow-list. Ask Xavier to add it.</p>}
            {sp.error && <p className="text-sm text-danger">{sp.error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
