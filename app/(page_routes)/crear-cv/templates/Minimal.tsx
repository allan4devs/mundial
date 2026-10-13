import type { TemplateProps } from "../types";
import {
  cleanBullets,
  contactBits,
  dateRange,
  hasLanguages,
  hasProjects,
  hasSkills,
  paragraphs,
} from "./shared";

// Airy, quiet type, hairline rules. Section labels sit in a narrow left
// gutter; content breathes on the right.

export function Minimal({ data, settings, labels }: TemplateProps) {
  const accent = settings.accent;
  const bits = contactBits(data);
  const summary = paragraphs(data.summary);

  return (
    <div
      className="h-full bg-white px-[64px] py-[60px] font-[family-name:var(--font-manrope)] text-[12.5px] leading-relaxed text-zinc-700"
      style={{ fontSize: `${12.5 * settings.fontScale}px` }}
    >
      <header className="mb-8">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
          <h1 className="text-[2.1em] font-light tracking-tight text-zinc-900">
            {data.fullName || labels.contact}
          </h1>
        </div>
        {data.headline && (
          <p className="mt-1 pl-[18px] text-[1em] text-zinc-500">{data.headline}</p>
        )}
        {bits.length > 0 && (
          <p className="mt-3 pl-[18px] text-[0.82em] text-zinc-400">
            {bits.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-2">/</span>}
                {b.text}
              </span>
            ))}
          </p>
        )}
      </header>

      {summary.length > 0 && (
        <Row title={labels.summary}>
          {summary.map((p, i) => (
            <p key={i} className={i === 0 ? "" : "mt-1.5"}>
              {p}
            </p>
          ))}
        </Row>
      )}

      {data.experience.some((e) => e.role || e.company) && (
        <Row title={labels.experience}>
          <div className="space-y-4">
            {data.experience
              .filter((e) => e.role || e.company || e.bullets.some(Boolean))
              .map((e) => {
                const range = dateRange(e.start, e.end, e.current, labels.present);
                const bullets = cleanBullets(e.bullets);
                return (
                  <div key={e.id} className="break-inside-avoid">
                    <h3 className="text-[1.02em] font-semibold text-zinc-900">
                      {e.role}
                      {e.company && <span className="font-normal text-zinc-400">{"  ·  "}{e.company}</span>}
                    </h3>
                    <p className="text-[0.8em] uppercase tracking-wide text-zinc-400">
                      {[range, e.location].filter(Boolean).join("  ·  ")}
                    </p>
                    {bullets.length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {bullets.map((b, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="mt-[0.6em] h-px w-3 shrink-0" style={{ backgroundColor: accent }} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
          </div>
        </Row>
      )}

      {data.education.some((e) => e.degree || e.school) && (
        <Row title={labels.education}>
          <div className="space-y-2.5">
            {data.education
              .filter((e) => e.degree || e.school)
              .map((e) => (
                <div key={e.id} className="break-inside-avoid">
                  <h3 className="text-[1em] font-semibold text-zinc-900">{e.degree}</h3>
                  <p className="text-[0.85em] text-zinc-500">
                    {[e.school, e.location, dateRange(e.start, e.end, false, labels.present)]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                  {e.note && <p className="text-[0.83em] text-zinc-400">{e.note}</p>}
                </div>
              ))}
          </div>
        </Row>
      )}

      {hasSkills(data) && (
        <Row title={labels.skills}>
          <div className="space-y-1.5">
            {data.skills
              .filter((g) => g.label || g.items.some(Boolean))
              .map((g) => (
                <div key={g.id}>
                  {g.label && (
                    <p className="text-[0.78em] uppercase tracking-wide text-zinc-400">{g.label}</p>
                  )}
                  <p className="text-[0.9em] text-zinc-700">{g.items.filter(Boolean).join(", ")}</p>
                </div>
              ))}
          </div>
        </Row>
      )}

      {hasLanguages(data) && (
        <Row title={labels.languages}>
          <p className="text-[0.9em]">
            {data.languages
              .filter((l) => l.name)
              .map((l) => [l.name, l.level].filter(Boolean).join(" — "))
              .join("   ·   ")}
          </p>
        </Row>
      )}

      {hasProjects(data) && (
        <Row title={labels.projects}>
          <div className="space-y-2">
            {data.projects
              .filter((p) => p.name || p.description)
              .map((p) => (
                <div key={p.id} className="break-inside-avoid text-[0.9em]">
                  <span className="font-semibold text-zinc-900">{p.name}</span>
                  {p.description && <p className="text-zinc-600">{p.description}</p>}
                </div>
              ))}
          </div>
        </Row>
      )}

      {data.references.trim() && (
        <Row title={labels.references}>
          <p className="text-[0.9em]">{data.references}</p>
        </Row>
      )}
    </div>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 border-t border-zinc-200 pt-4 sm:grid sm:grid-cols-[130px_1fr] sm:gap-5">
      <h2 className="mb-1.5 text-[0.78em] font-semibold uppercase tracking-[0.18em] text-zinc-400 sm:mb-0">
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
