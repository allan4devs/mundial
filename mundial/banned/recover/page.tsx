import React, { Suspense } from "react";

export const dynamic = "force-dynamic";

import RecoverClient from "./RecoverClient";

export default function RecoverPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060e08] flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white/60" />
        </div>
      }
    >
      <RecoverClient />
    </Suspense>
  );
}
