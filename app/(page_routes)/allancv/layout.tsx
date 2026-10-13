import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Allan Rojas — Senior Java + React Engineer",
  description:
    "Senior Full-Stack Engineer — 11+ years shipping Java/Spring Boot and React/TypeScript systems on AWS.",
};

export default function AllanCvLayout({ children }: { children: React.ReactNode }) {
  return children;
}
