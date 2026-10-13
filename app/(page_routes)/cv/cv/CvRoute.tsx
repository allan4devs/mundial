"use client";

import { CvSavedPreview } from "./CvSavedPreview";
import { toEditable } from "../editableCv";
import { getCvBySlug } from "../data/cv-data";

/** Shared client boundary for every data-driven CV route. */
export function CvRoute({ slug }: { slug: string }) {
  const cv = getCvBySlug(slug);
  if (!cv) return null;

  return <CvSavedPreview savedCv={{ ...toEditable(cv), density: cv.density ?? "standard" }} archive />;
}
