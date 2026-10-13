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

// Dense, small type, two columns under a slim header. Aims to keep a full
// career on a single page.

export function Compacto({ data, settings, labels }: TemplateProps) {
  const accent = settings.accent;
  const bits = contactBits(data);
  const summary = paragraphs(data.summary);

  return (
    <div
      className="h-full bg-white px-[44px] py-[38px] font-[family-name:var(--font-manrope)] text-[11px] leading-snug text-zinc-700"
      style={{ fontSize: `${11 * settings.fontScale}px` }}
    >
      <header className="flex items-end justify-between gap-4 border-b-2 pb-2" style={{ borderColor: accent }}>
        <div>
          <h1 className="text-[1.9em] font-bold leading-none tracking-tight text-zinc-900">
            {data.fullName || labels.contact}
          </h1>
          {data.headline && (
            <p className="mt-0.5 text-[0.95em] font-semibold uppercase tracking-wide" style={{ color: accent }}>
              {data.headline}
            </p>
          )}
        </div>
        {bits.length > 0 && (
          <ul className="max-w-[46%] text-right text-[0.82em] text-zinc-500">
            {bits.map((b, i) => (
              <li key={i} className="leading-tight">
                {b.text}
              </li>
            ))}
          </ul>
        )}
      </header>

      {summary.length > 0 && (
        <p className="mt-2 text-[0.92em] text-zinc-600">{summary.join("  ")}</p>
      )}

      <div className="mt-3 grid grid-cols-[1.55fr_1fr] gap-6">
        {/* left: experience */}
        <div>
          {data.experience.some((e) => e.role || e.company) && (
            <Section title={labels.experience} accent={accent}>
              <div className="space-y-2.5">
                {data.experience
                  .filter((e) => e.role || e.company || e.bullets.some(Boolean))
                  .map((e) => {
                    const range = dateRange(e.start, e.end, e.current, labels.present);
                    const bullets = cleanBullets(e.bullets);
                    return (
                      <div key={e.id} className="break-inside-avoid">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-[0.98em] font-bold text-zinc-900">{e.role}</h3>
                          {range && <span className="shrink-0 text-[0.78em] text-zinc-400">{range}</span>}
                        </div>
                        <p className="text-[0.82em] font-medium" style={{ color: accent }}>
                          {[e.company, e.location].filter(Boolean).join(" · ")}
                        </p>
                        {bullets.length > 0 && (
                          <ul className="mt-0.5 list-disc space-y-0.5 pl-3.5 marker:text-zinc-300">
                            {bullets.map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
              </div>
            </Section>
          )}

          {hasProjects(data) && (
            <Section title={labels.projects} accent={accent}>
              <div className="space-y-1">
                {data.projects
                  .filter((p) => p.name || p.description)
                  .map((p) => (
                    <div key={p.id} className="text-[0.86em]">
                      <span className="font-semibold text-zinc-900">{p.name}</span>
                      {p.description && <span className="text-zinc-600"> — {p.description}</span>}
                    </div>
                  ))}
              </div>
            </Section>
          )}
        </div>

        {/* right: rail */}
        <div>
          {hasSkills(data) && (
            <Section title={labels.skills} accent={accent}>
              <div className="space-y-1.5">
                {data.skills
                  .filter((g) => g.label || g.items.some(Boolean))
                  .map((g) => (
                    <div key={g.id}>
                      {g.label && (
                        <p className="text-[0.76em] font-semibold uppercase tracking-wide text-zinc-400">
                          {g.label}
                        </p>
                      )}
                      <p className="text-[0.86em]">{g.items.filter(Boolean).join(" · ")}</p>
                    </div>
                  ))}
              </div>
            </Section>
          )}

          {hasLanguages(data) && (
            <Section title={labels.languages} accent={accent}>
              <ul className="space-y-0.5">
                {data.languages
                  .filter((l) => l.name)
                  .map((l) => (
                    <li key={l.id} className="text-[0.86em]">
                      <span className="font-semibold text-zinc-900">{l.name}</span>
                      {l.level && <span className="text-zinc-500"> — {l.level}</span>}
                    </li>
                  ))}
              </ul>
            </Section>
          )}

          {data.education.some((e) => e.degree || e.school) && (
            <Section title={labels.education} accent={accent}>
              <div className="space-y-1.5">
                {data.education
                  .filter((e) => e.degree || e.school)
                  .map((e) => (
                    <div key={e.id} className="break-inside-avoid">
                      <p className="text-[0.9em] font-bold text-zinc-900">{e.degree}</p>
                      <p className="text-[0.82em] text-zinc-500">{e.school}</p>
                      <p className="text-[0.78em] text-zinc-400">
                        {[e.location, dateRange(e.start, e.end, false, labels.present)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
              </div>
            </Section>
          )}

          {data.references.trim() && (
            <Section title={labels.references} accent={accent}>
              <p className="text-[0.86em]">{data.references}</p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-3">
      <h2
        className="mb-1 text-[0.82em] font-bold uppercase tracking-[0.16em] text-zinc-900"
        style={{ borderBottom: `1px solid ${accent}55`, paddingBottom: 2 }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
