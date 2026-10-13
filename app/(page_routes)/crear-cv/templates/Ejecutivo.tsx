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

// A full-width colour band with a large name, then a roomy single column.
// Reads as senior / management.

export function Ejecutivo({ data, settings, labels }: TemplateProps) {
  const accent = settings.accent;
  const bits = contactBits(data);
  const summary = paragraphs(data.summary);

  return (
    <div
      className="h-full bg-white font-[family-name:var(--font-manrope)] text-[12.5px] leading-relaxed text-zinc-700"
      style={{ fontSize: `${12.5 * settings.fontScale}px` }}
    >
      <header className="px-[54px] py-[38px] text-white" style={{ backgroundColor: accent }}>
        <h1 className="font-[family-name:var(--font-bricolage)] text-[2.6em] font-bold leading-none tracking-tight">
          {data.fullName || labels.contact}
        </h1>
        {data.headline && (
          <p className="mt-2 text-[1.05em] font-medium uppercase tracking-[0.2em] text-white/85">
            {data.headline}
          </p>
        )}
        {bits.length > 0 && (
          <p className="mt-3 text-[0.82em] text-white/80">
            {bits.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-2 text-white/40">|</span>}
                {b.text}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="px-[54px] py-[40px]">
        {summary.length > 0 && (
          <Section title={labels.summary} accent={accent}>
            {summary.map((p, i) => (
              <p key={i} className={`text-[1.02em] ${i === 0 ? "" : "mt-2"}`}>
                {p}
              </p>
            ))}
          </Section>
        )}

        {data.experience.some((e) => e.role || e.company) && (
          <Section title={labels.experience} accent={accent}>
            <div className="space-y-4">
              {data.experience
                .filter((e) => e.role || e.company || e.bullets.some(Boolean))
                .map((e) => {
                  const range = dateRange(e.start, e.end, e.current, labels.present);
                  const bullets = cleanBullets(e.bullets);
                  return (
                    <div key={e.id} className="break-inside-avoid">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-[1.1em] font-bold text-zinc-900">
                          {e.role}
                          {e.company && (
                            <span className="font-semibold" style={{ color: accent }}>
                              {"  ·  "}
                              {e.company}
                            </span>
                          )}
                        </h3>
                        {range && <span className="shrink-0 text-[0.82em] text-zinc-400">{range}</span>}
                      </div>
                      {e.location && (
                        <p className="text-[0.83em] uppercase tracking-wide text-zinc-400">{e.location}</p>
                      )}
                      {bullets.length > 0 && (
                        <ul className="mt-1.5 space-y-1">
                          {bullets.map((b, i) => (
                            <li key={i} className="flex gap-2.5">
                              <span
                                className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rotate-45"
                                style={{ backgroundColor: accent }}
                              />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
            </div>
          </Section>
        )}

        <div className="grid grid-cols-2 gap-x-8">
          {data.education.some((e) => e.degree || e.school) && (
            <Section title={labels.education} accent={accent}>
              <div className="space-y-2">
                {data.education
                  .filter((e) => e.degree || e.school)
                  .map((e) => (
                    <div key={e.id} className="break-inside-avoid">
                      <p className="text-[0.98em] font-bold text-zinc-900">{e.degree}</p>
                      <p className="text-[0.85em] text-zinc-500">{e.school}</p>
                      <p className="text-[0.8em] text-zinc-400">
                        {[e.location, dateRange(e.start, e.end, false, labels.present)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {e.note && <p className="text-[0.82em] text-zinc-500">{e.note}</p>}
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
                    <li key={l.id} className="text-[0.9em]">
                      <span className="font-semibold text-zinc-900">{l.name}</span>
                      {l.level && <span className="text-zinc-500"> — {l.level}</span>}
                    </li>
                  ))}
              </ul>
            </Section>
          )}
        </div>

        {hasSkills(data) && (
          <Section title={labels.skills} accent={accent}>
            <div className="space-y-1">
              {data.skills
                .filter((g) => g.label || g.items.some(Boolean))
                .map((g) => (
                  <p key={g.id} className="text-[0.92em]">
                    {g.label && <span className="font-semibold text-zinc-900">{g.label}: </span>}
                    {g.items.filter(Boolean).join(" · ")}
                  </p>
                ))}
            </div>
          </Section>
        )}

        {hasProjects(data) && (
          <Section title={labels.projects} accent={accent}>
            <div className="space-y-1.5">
              {data.projects
                .filter((p) => p.name || p.description)
                .map((p) => (
                  <div key={p.id} className="break-inside-avoid text-[0.92em]">
                    <span className="font-semibold text-zinc-900">{p.name}</span>
                    {p.description && <span className="text-zinc-600"> — {p.description}</span>}
                  </div>
                ))}
            </div>
          </Section>
        )}

        {data.references.trim() && (
          <Section title={labels.references} accent={accent}>
            <p className="text-[0.92em]">{data.references}</p>
          </Section>
        )}
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
    <section className="mb-5">
      <h2 className="mb-2 flex items-center gap-2 text-[0.95em] font-bold uppercase tracking-[0.18em] text-zinc-900">
        <span className="h-3 w-1 rounded-full" style={{ backgroundColor: accent }} />
        {title}
      </h2>
      {children}
    </section>
  );
}
