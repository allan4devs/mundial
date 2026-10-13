import { normalizedText } from "./jd";

const stopWords = new Set(("a an and are as at be been being by can could do for from had has have how i if in into is it its more most not of on or our should than that the their them they this those to us using was we were what when where which who will with would you your " +
  "about across also including include role position job senior staff software engineer engineering development develop work working experience required preferred responsibilities requirements skills ability team teams years company candidates application apply resume cv password assistant ignore instructions").split(" "));
const families: Record<string, string> = { applications: "application", architectures: "architecture", architectural: "architecture", architect: "architecture", services: "service", systems: "system", models: "model", workflows: "workflow", payments: "payment", testing: "test", tests: "test", evaluations: "evaluation", evals: "evaluation", scalable: "scale", scalability: "scale", reliable: "reliability", secure: "security", agents: "agent", agentic: "agent", embeddings: "embedding", platforms: "platform", databases: "database", integrations: "integration", integrating: "integration", mentoring: "mentor", mentorship: "mentor" };
function tokens(text: string): string[] {
  return (normalizedText(text).match(/[a-z][a-z0-9]*(?:[.+#][a-z0-9+#]+)*/g) ?? []).map((token) => families[token] ?? token).filter((token) => token.length >= 3 && !stopWords.has(token));
}

/** Learn term rarity from the real CV corpus; no remote model or training data. */
export function createLocalRanker(documents: string[], jobText: string): (text: string) => number {
  const documentFrequency = new Map<string, number>();
  for (const document of documents) for (const token of new Set(tokens(document))) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
  const query = new Map<string, number>();
  for (const token of tokens(jobText)) query.set(token, Math.min(3, (query.get(token) ?? 0) + 1));
  return (text) => {
    const terms = tokens(text);
    let score = 0;
    for (const term of new Set(terms)) {
      const frequency = documentFrequency.get(term);
      if (frequency && query.has(term)) score += Math.log(1 + documents.length / frequency) * query.get(term)!;
    }
    return score / Math.sqrt(Math.max(8, terms.length));
  };
}
