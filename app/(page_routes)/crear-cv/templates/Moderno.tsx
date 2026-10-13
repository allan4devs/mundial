import type { TemplateProps } from "../types";
import {
  cleanBullets,
  contactBits,
  dateRange,
  hasLanguages,
  hasProjects,
  hasSkills,
  monogram,
  paragraphs,
} from "./shared";

// Two columns: a tinted sidebar (contact, skills, languages, education) and a
// main column (summary, experience, projects).

export function Moderno({ data, settings, labels }: TemplateProps) {
  const accent = settings.accent;
  const bits = contactBits(data);
  const summary = paragraphs(data.summary);

  return (
    <div
      className="grid h-full grid-cols-[35%_1fr] bg-white font-[family-name:var(--font-manrope)] text-[12.5px] leading-relaxed text-zinc-700"
      style={{ fontSize: `${12.5 * settings.fontScale}px` }}
    >
      {/* sidebar */}
      <aside className="h-full px-[26px] py-[34px] text-white" style={{ backgroundColor: accent }}>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-[1.5em] font-bold">
            {monogram(data.fullName) || "CV"}
          </div>
          <h1 className="mt-3 text-[1.5em] font-bold leading-tight">{data.fullName || labels.contact}</h1>
          {data.headline && (
            <p className="mt-1 text-[0.9em] font-medium text-white/85">{data.headline}</p>
          )}
        </div>

        {bits.length > 0 && (
          <SideBlock title={labels.contact}>
            <ul className="space-y-1">
              {bits.map((b, i) => (
                <li key={i} className="break-words text-[0.85em] text-white/90">
                  {b.text}
                </li>
              ))}
            </ul>
          </SideBlock>
        )}

        {hasSkills(data) && (
          <SideBlock title={labels.skills}>
            <div className="space-y-2">
              {data.skills
                .filter((g) => g.label || g.items.some(Boolean))
                .map((g) => (
                  <div key={g.id}>
                    {g.label && (
                      <p className="text-[0.8em] font-semibold uppercase tracking-wide text-white/70">
                        {g.label}
                      </p>
                    )}
                    <p className="text-[0.85em] text-white/90">{g.items.filter(Boolean).join(" · ")}</p>
                  </div>
                ))}
            </div>
          </SideBlock>
        )}

        {hasLanguages(data) && (
          <SideBlock title={labels.languages}>
            <ul className="space-y-0.5">
              {data.languages
                .filter((l) => l.name)
                .map((l) => (
                  <li key={l.id} className="text-[0.85em] text-white/90">
                    {l.name}
                    {l.level && <span className="text-white/60"> — {l.level}</span>}
                  </li>
                ))}
            </ul>
          </SideBlock>
        )}

        {data.education.some((e) => e.degree || e.school) && (
          <SideBlock title={labels.education}>
            <div className="space-y-2">
              {data.education
                .filter((e) => e.degree || e.school)
                .map((e) => (
                  <div key={e.id}>
                    <p className="text-[0.88em] font-semibold text-white">{e.degree}</p>
                    <p className="text-[0.82em] text-white/80">{e.school}</p>
                    <p className="text-[0.8em] text-white/60">
                      {[e.location, dateRange(e.start, e.end, false, labels.present)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {e.note && <p className="text-[0.8em] text-white/70">{e.note}</p>}
                  </div>
                ))}
            </div>
          </SideBlock>
        )}
      </aside>

      {/* main */}
      <div className="px-[34px] py-[34px]">
        {summary.length > 0 && (
          <MainSection title={labels.summary} accent={accent}>
            {summary.map((p, i) => (
              <p key={i} className={i === 0 ? "" : "mt-1.5"}>
                {p}
              </p>
            ))}
          </MainSection>
        )}

        {data.experience.some((e) => e.role || e.company) && (
          <MainSection title={labels.experience} accent={accent}>
            <div className="space-y-3.5">
              {data.experience
                .filter((e) => e.role || e.company || e.bullets.some(Boolean))
                .map((e) => {
                  const range = dateRange(e.start, e.end, e.current, labels.present);
                  const bullets = cleanBullets(e.bullets);
                  return (
                    <div key={e.id} className="break-inside-avoid border-l-2 pl-3" style={{ borderColor: `${accent}44` }}>
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-[1.02em] font-bold text-zinc-900">{e.role}</h3>
                        {range && <span className="shrink-0 text-[0.78em] text-zinc-400">{range}</span>}
                      </div>
                      <p className="text-[0.85em] font-medium" style={{ color: accent }}>
                        {[e.company, e.location].filter(Boolean).join(" · ")}
                      </p>
                      {bullets.length > 0 && (
                        <ul className="mt-1 list-disc space-y-0.5 pl-4 marker:text-zinc-300">
                          {bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
            </div>
          </MainSection>
        )}

        {hasProjects(data) && (
          <MainSection title={labels.projects} accent={accent}>
            <div className="space-y-2">
              {data.projects
                .filter((p) => p.name || p.description)
                .map((p) => (
                  <div key={p.id} className="break-inside-avoid text-[0.9em]">
                    <span className="font-semibold text-zinc-900">{p.name}</span>
                    {p.url && (
                      <span className="text-zinc-400"> — {p.url.replace(/^https?:\/\//, "")}</span>
                    )}
                    {p.description && <p className="text-zinc-600">{p.description}</p>}
                  </div>
                ))}
            </div>
          </MainSection>
        )}

        {data.references.trim() && (
          <MainSection title={labels.references} accent={accent}>
            <p className="text-[0.9em]">{data.references}</p>
          </MainSection>
        )}
      </div>
    </div>
  );
}

function SideBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-t border-white/25 pt-3">
      <h2 className="mb-1.5 text-[0.82em] font-bold uppercase tracking-[0.16em] text-white">{title}</h2>
      {children}
    </div>
  );
}

function MainSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <h2
        className="mb-1.5 text-[0.95em] font-bold uppercase tracking-[0.16em]"
        style={{ color: accent }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
