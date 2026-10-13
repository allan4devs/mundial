import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Allan Rojas — Senior Software Engineer",
  description:
    "Interactive career constellation of Allan Rojas — 11+ years building cloud-native systems across Java/Spring Boot, TypeScript/React, PHP/Laravel and AWS.",
};

export default function AllanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
