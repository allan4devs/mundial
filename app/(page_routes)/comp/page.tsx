import type { Metadata } from "next";
import { CompanyDirectory } from "./CompanyDirectory";

export const metadata: Metadata = {
  title: "Comp | Company workspace",
  description: "Explore companies, save careers pages, and organize your favorites.",
  robots: { index: false, follow: false },
};

export default function CompPage() {
  return <CompanyDirectory />;
}
