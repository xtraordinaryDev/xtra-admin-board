import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "va";

export type Viewer = {
  email: string;
  role: Role;
  name: string;
};

/**
 * The signed-in user, checked against the allow-list.
 * Anyone signed in but not on the list is signed out and sent to /login.
 */
export async function requireViewer(): Promise<Viewer> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/login");

  const { data: allowed } = await supabase
    .from("allowed_users")
    .select("email, role, display_name")
    .ilike("email", user.email)
    .maybeSingle();

  if (!allowed) {
    await supabase.auth.signOut();
    redirect("/login?denied=1");
  }
  return {
    email: allowed.email,
    role: allowed.role as Role,
    name: allowed.display_name || (allowed.role === "owner" ? "Xavier" : "VA"),
  };
}

export async function requireOwner(): Promise<Viewer> {
  const v = await requireViewer();
  if (v.role !== "owner") redirect("/");
  return v;
}
