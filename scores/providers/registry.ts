import type { ScoreProvider } from "./types";
import { mockProvider } from "./mock";
import { manualProvider } from "./manual";

const PROVIDERS: ScoreProvider[] = [manualProvider, mockProvider];

export function listProviders() {
  return PROVIDERS.map((p) => ({ id: p.id, name: p.name }));
}

export function getProvider(id: string): ScoreProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
