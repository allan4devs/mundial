import type { Metadata } from "next";
import UfcAdminClient from "./UfcAdminClient";

export const metadata: Metadata = {
  title: "Admin | UFC Freedom 250",
  robots: { index: false, follow: false },
};

export default function UfcAdminPage() {
  return <UfcAdminClient />;
}
