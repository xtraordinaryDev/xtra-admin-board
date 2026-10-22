import Link from "next/link";
import type { Viewer } from "@/lib/auth";
import { signOut } from "@/app/actions";

const NAV: { href: string; label: string; ownerOnly?: boolean }[] = [
  { href: "/", label: "Today" },
  { href: "/week", label: "Week" },
  { href: "/memo", label: "Memo" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/metrics", label: "Metrics" },
  { href: "/settings", label: "Settings", ownerOnly: true },
];

export function Shell({ viewer, active, children }: { viewer: Viewer; active: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-dark text-off-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Mark />
            <span className="wordmark text-sm">X-traordinary</span>
          </Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {NAV.filter((n) => !n.ownerOnly || viewer.role === "owner").map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-md px-3 py-1 font-semibold ${
                  active === n.href ? "bg-gold text-ink" : "text-off-white/80 hover:bg-white/10"
                }`}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-xs text-off-white/70">
            <span>
              {viewer.name} · {viewer.role === "owner" ? "owner" : "VA"}
            </span>
            <form action={signOut}>
              <button className="underline hover:text-off-white">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      <footer className="border-t border-line px-4 py-3 text-center text-xs text-muted">
        The development team for companies that don&apos;t have one.
      </footer>
    </div>
  );
}

/** The X mark: two interlocking chevrons, gold left, off-white right (for dark grounds). */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
      <path
        d="M63.55 58.95L58.95 63.55L95.4 100L16.74 178.67L16.74 160.28L77.02 100L31.91 54.89L77.87 54.89L100 77.02L122.1 54.92L140.48 54.92L100 95.4Z"
        fill="#DB9815"
      />
      <path
        d="M136.45 141.05L141.05 136.45L104.6 100L183.26 21.33L183.26 39.72L122.98 100L168.09 145.11L122.13 145.11L100 122.98L77.9 145.08L59.52 145.08L100 104.6Z"
        fill="#F2EFE6"
      />
    </svg>
  );
}
