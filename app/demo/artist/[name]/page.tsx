import type { Metadata } from "next";
import { DemoEntity } from "@/components/DemoLocalMerge";
import { loadDemoShows } from "@/lib/demoLive";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Concert Map demo` };
}

export default async function DemoArtistPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return (
    <DemoEntity
      kind="artist"
      name={decodeURIComponent(name)}
      initialShows={await loadDemoShows()}
    />
  );
}
