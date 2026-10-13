import type { Metadata } from "next";
import type { ReactNode } from "react";

import SessionProvider from "@/lib/SessionProvider";

export const metadata: Metadata = {
  title: "Autenticación | La Vieja Adventures",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
