import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConcertApp from "@/components/ConcertApp";
import Hero from "@/components/Hero";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // First-time users pick a handle before entering the app.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) {
    redirect("/welcome");
  }

  const { count } = await supabase
    .from("shows")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <main className="flex flex-col bg-[#eef1f6]">
      <Hero email={user.email ?? "you"} count={count ?? 0} />
      {/* Map/app sheet. The hero above dissolves into #eef1f6 and the map fades
          in from the same colour, so there's no seam. */}
      <section id="app" className="h-dvh w-full bg-[#eef1f6]">
        <ConcertApp handle={profile.handle} />
      </section>
    </main>
  );
}
