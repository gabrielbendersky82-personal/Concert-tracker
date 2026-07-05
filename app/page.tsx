import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConcertApp from "@/components/ConcertApp";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <ConcertApp userEmail={user.email ?? "you"} />;
}
