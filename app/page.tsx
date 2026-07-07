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

  const { count } = await supabase
    .from("shows")
    .select("id", { count: "exact", head: true });

  return (
    <main className="relative">
      {/* Sticky hero: the map slides up over it on scroll */}
      <div className="sticky top-0 h-dvh">
        <Hero email={user.email ?? "you"} count={count ?? 0} />
      </div>
      {/* Map/app sheet: rounded top + upward shadow, overlapping the hero */}
      <section
        id="app"
        className="relative z-10 -mt-7 h-dvh w-full overflow-hidden rounded-t-[28px] shadow-[0_-30px_60px_rgba(0,0,0,0.45)]"
      >
        <ConcertApp userEmail={user.email ?? "you"} />
      </section>
    </main>
  );
}
