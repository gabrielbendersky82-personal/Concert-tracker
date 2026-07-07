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
    <main className="flex flex-col">
      <Hero email={user.email ?? "you"} count={count ?? 0} />
      <section id="app" className="h-dvh w-full">
        <ConcertApp userEmail={user.email ?? "you"} />
      </section>
    </main>
  );
}
