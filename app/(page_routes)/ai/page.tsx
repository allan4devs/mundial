import { Suspense } from "react";
import AIAssistantClient from "./AIAssistantClient";

export default function AIPage() {
  return (
    <Suspense>
      <AIAssistantClient />
    </Suspense>
  );
}
