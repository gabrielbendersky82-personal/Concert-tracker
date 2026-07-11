import type { Metadata } from "next";
import { DemoEntity } from "@/components/DemoLocalMerge";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  return { title: `${decodeURIComponent(name)} · Concert Map demo` };
}

export default async function DemoVenuePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return <DemoEntity kind="venue" name={decodeURIComponent(name)} />;
}
