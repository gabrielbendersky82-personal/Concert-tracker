import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ScrollStage from "@/components/ScrollStage";

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

  return <ScrollStage email={user.email ?? "you"} count={count ?? 0} />;
}
