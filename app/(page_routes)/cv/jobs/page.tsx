import { redirect } from "next/navigation";

/** The broad job archive is the single home for CV Jobs. */
export default function CvJobsPage() {
  redirect("/cv/archive");
}
