import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminFromCookies } from "@/lib/admin-auth";
import { getGeneration } from "@/lib/cv/store";
import { CvSavedPreview } from "./CvSavedPreview";

export async function CvGeneratedPage({ id }: { id: string }) {
  const admin = await getAdminFromCookies();
  if (!admin) return <main className="mx-auto max-w-xl px-5 py-16"><h1 className="text-2xl font-semibold">Sign in to open this CV</h1><Link href="/cv" className="mt-4 inline-block underline">Go to the CV generator</Link></main>;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  let generation;
  try { generation = await getGeneration(admin.id, id); }
  catch { return <main className="mx-auto max-w-xl px-5 py-16"><h1 className="text-2xl font-semibold">Saved CV could not be loaded</h1><p className="mt-4">Refresh to try again. Your saved CV has not been changed.</p><Link href="/cv" className="mt-4 inline-block underline">Back to the generator</Link></main>; }
  if (!generation) notFound();
  if (generation.status !== "complete" || !generation.result) return <main className="mx-auto max-w-xl px-5 py-16">
    <Link href={`/cv?retry=${generation.id}`} className="text-sm underline">← Try again with this job description</Link>
    <h1 className="mt-8 text-2xl font-semibold">{generation.status === "pending" ? "Your CV is generating" : "This attempt needs a retry"}</h1>
    <p className="mt-4 text-zinc-600">{generation.error || "The server is cleaning the description and checking your CV evidence. Refresh this page in a moment."}</p>
    <details className="mt-6"><summary>Saved job description</summary><p className="mt-3 whitespace-pre-wrap text-sm">{generation.jobDescription}</p></details>
  </main>;
  return <CvSavedPreview savedCv={generation.result.cv} result={generation.result} />;
}
