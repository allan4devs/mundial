import type { Metadata } from "next";
import { CvGenerator } from "./cv/CvGenerator";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { getGeneration } from "@/lib/cv/store";

export const metadata: Metadata = { title: "CV Generator", robots: { index: false, follow: false } };

export default async function CvPage({ searchParams }: { searchParams: Promise<{ retry?: string }> }) {
  const { retry } = await searchParams;
  let initialJd = "";
  if (retry && /^[0-9a-f-]{36}$/i.test(retry)) {
    const admin = await getAdminFromCookies();
    if (admin) {
      try { initialJd = (await getGeneration(admin.id, retry))?.jobDescription ?? ""; }
      catch { /* Keep the generator usable when a saved attempt cannot be read. */ }
    }
  }
  return <CvGenerator initialJd={initialJd} />;
}
