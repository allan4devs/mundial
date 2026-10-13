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

// Single column, conservative, ATS-friendly. Accent only on the name and the
// section rules so keyword parsers see clean text.

export function Clasico({ data, settings, labels }: TemplateProps) {
  const accent = settings.accent;
  const bits = contactBits(data);
  const summary = paragraphs(data.summary);

  return (
    <div
      className="h-full bg-white px-[54px] py-[46px] font-[family-name:var(--font-manrope)] text-[13px] leading-relaxed text-zinc-800"
      style={{ fontSize: `${13 * settings.fontScale}px` }}
    >
      <header className="text-center">
        <h1 className="text-[2.05em] font-bold leading-tight tracking-tight text-zinc-900">
          {data.fullName || labels.contact}
        </h1>
        {data.headline && (
          <p
            className="mt-1 text-[0.98em] font-semibold uppercase tracking-[0.16em]"
            style={{ color: accent }}
          >
            {data.headline}
          </p>
        )}
        {bits.length > 0 && (
          <p className="mt-2 text-[0.8em] text-zinc-500">
            {bits.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-1.5 text-zinc-300">·</span>}
                {b.text}
              </span>
            ))}
          </p>
        )}
      </header>

      {summary.length > 0 && (
        <Section title={labels.summary} accent={accent}>
          {summary.map((p, i) => (
            <p key={i} className={i === 0 ? "" : "mt-1.5"}>
              {p}
            </p>
          ))}
        </Section>
      )}

      {data.experience.some((e) => e.role || e.company) && (
        <Section title={labels.experience} accent={accent}>
          <div className="space-y-3">
            {data.experience
              .filter((e) => e.role || e.company || e.bullets.some(Boolean))
              .map((e) => {
                const range = dateRange(e.start, e.end, e.current, labels.present);
                const bullets = cleanBullets(e.bullets);
                return (
                  <div key={e.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[1.03em] font-bold text-zinc-900">{e.role}</h3>
                      {range && (
                        <span className="shrink-0 text-[0.8em] text-zinc-500">{range}</span>
                      )}
                    </div>
                    <p className="text-[0.86em] font-medium text-zinc-500">
                      {[e.company, e.location].filter(Boolean).join(" · ")}
                    </p>
                    {bullets.length > 0 && (
                      <ul className="mt-1 list-disc space-y-0.5 pl-5">
                        {bullets.map((b, i) => (
                          <li key={i} className="pl-0.5" style={{ marginLeft: 0 }}>
                            {b}
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

      {data.education.some((e) => e.degree || e.school) && (
        <Section title={labels.education} accent={accent}>
          <div className="space-y-2">
            {data.education
              .filter((e) => e.degree || e.school)
              .map((e) => {
                const range = dateRange(e.start, e.end, false, labels.present);
                return (
                  <div key={e.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[1em] font-bold text-zinc-900">{e.degree}</h3>
                      {range && (
                        <span className="shrink-0 text-[0.8em] text-zinc-500">{range}</span>
                      )}
                    </div>
                    <p className="text-[0.86em] text-zinc-500">
                      {[e.school, e.location].filter(Boolean).join(" · ")}
                    </p>
                    {e.note && <p className="text-[0.84em] text-zinc-500">{e.note}</p>}
                  </div>
                );
              })}
          </div>
        </Section>
      )}

      {hasSkills(data) && (
        <Section title={labels.skills} accent={accent}>
          <div className="space-y-1">
            {data.skills
              .filter((g) => g.label || g.items.some(Boolean))
              .map((g) => (
                <p key={g.id} className="text-[0.9em]">
                  {g.label && <span className="font-semibold text-zinc-900">{g.label}: </span>}
                  {g.items.filter(Boolean).join(" · ")}
                </p>
              ))}
          </div>
        </Section>
      )}

      {hasLanguages(data) && (
        <Section title={labels.languages} accent={accent}>
          <p className="text-[0.9em]">
            {data.languages
              .filter((l) => l.name)
              .map((l) => [l.name, l.level].filter(Boolean).join(" — "))
              .join("  ·  ")}
          </p>
        </Section>
      )}

      {hasProjects(data) && (
        <Section title={labels.projects} accent={accent}>
          <div className="space-y-1.5">
            {data.projects
              .filter((p) => p.name || p.description)
              .map((p) => (
                <div key={p.id} className="break-inside-avoid text-[0.9em]">
                  <span className="font-semibold text-zinc-900">{p.name}</span>
                  {p.url && <span className="text-zinc-400"> — {p.url.replace(/^https?:\/\//, "")}</span>}
                  {p.description && <p className="text-zinc-600">{p.description}</p>}
                </div>
              ))}
          </div>
        </Section>
      )}

      {data.references.trim() && (
        <Section title={labels.references} accent={accent}>
          <p className="text-[0.9em]">{data.references}</p>
        </Section>
      )}
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
    <section className="mt-4">
      <h2
        className="mb-1.5 border-b-2 pb-1 text-[0.92em] font-bold uppercase tracking-[0.16em] text-zinc-900"
        style={{ borderColor: accent }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
