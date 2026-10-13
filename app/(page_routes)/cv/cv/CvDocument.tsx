import type { CSSProperties, Ref } from "react";
import { GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CvData, SummarySegment } from "../types";
import { color, gap, margin, sheet, text } from "../design";

// The printable résumé — one physical A4 page, identical layout for every
// variant (only `cv` data differs). Every visual decision comes from ./design;
// this file is structure only, no magic numbers. Kept free of variant-switching
// / audit chrome so it prints clean on its own.

const mm = (n: number) => `${n}mm`;

const DEFAULT_LABELS = {
  coreSkills: "Core Skills",
  education: "Education",
  languages: "Languages",
  whatIBring: "What I Bring",
  summary: "Professional Summary",
  experience: "Professional Experience",
  documentType: "Résumé",
} as const;

export function CvDocument({ cv, sheetRef }: { cv: CvData; sheetRef?: Ref<HTMLElement> }) {
  const { personalInfo, contactInfo, primarySkills, secondarySkills, education, languages, summary, highlights, experience } =
    cv;
  const L = { ...DEFAULT_LABELS, ...cv.labels };
  const linear = cv.personalInfo.name === "Oscar Steve Vindas Campos";
  const compact = cv.density === "compact";

  if (linear) {
    return <LinearCv cv={cv} sheetRef={sheetRef} labels={L as typeof DEFAULT_LABELS} />;
  }

  const sidebarPad: CSSProperties = {
    padding: `${mm(compact ? 9 : margin.cvTop)} ${mm(margin.cvSideNarrow)} ${mm(compact ? 8 : margin.cvBottom)}`,
  };
  const mainPad: CSSProperties = {
    padding: `${mm(compact ? 9 : margin.cvTop)} ${mm(compact ? 9 : margin.cvSideWide)} ${mm(compact ? 8 : margin.cvBottom)}`,
  };

  return (
    <article ref={sheetRef} className={sheet.frame} style={sheet.style}>
      <div className={sheet.topRule} />

      <div className="grid h-full" style={{ gridTemplateColumns: `${margin.cvSidebarW}mm 1fr` }}>
        {/* ── sidebar ─────────────────────────────────────── */}
        <aside className={`flex h-full flex-col border-r ${color.hairline} ${color.sidebar}`} style={sidebarPad}>
          <header className="flex flex-col items-center text-center">
            <div className={`flex items-center justify-center rounded-full border border-teal-600/30 bg-white shadow-sm ${compact ? "h-9 w-9" : "h-11 w-11"}`}>
              <span className={text.monogram}>{monogram(personalInfo.name)}</span>
            </div>
            <h1 className={`${compact ? "mt-1.5" : "mt-2.5"} ${text.name}`} style={compact ? { fontSize: "17px" } : undefined}>{personalInfo.name}</h1>
            <p className={`${compact ? "mt-1" : "mt-2"} ${text.title}`}>{personalInfo.title}</p>
            <span className={`${compact ? "mt-1.5" : "mt-2.5"} block h-px w-8 ${color.accentRule}`} />
          </header>

          <div className={`${compact ? "mt-2.5 px-2 py-1.5" : "mt-4 px-2.5 py-2"} rounded-md border ${color.hairline} bg-white`}>
            <div className={compact ? "space-y-0.5" : "space-y-1"}>
              {contactInfo.map((item) => (
                <ContactItem key={item.text} icon={item.icon} label={item.text} href={item.href} external={item.external} />
              ))}
            </div>
          </div>

          <SidebarHeading title={L.coreSkills} compact={compact} />
          <div className={compact ? "mt-1.5 space-y-1.5" : "mt-2.5 space-y-2"}>
            {primarySkills.map((group) => (
              <div key={group.label}>
                <p className={text.skillLabel}>{group.label}</p>
                <p className={`mt-0.5 ${text.skillItems}`} style={compact ? { lineHeight: 1.35 } : undefined}>{group.items.join("  ·  ")}</p>
              </div>
            ))}
            {secondarySkills.map((group) => (
              <div key={group.label}>
                <p className={text.skillLabelMuted}>{group.label}</p>
                <p className={`mt-0.5 ${text.skillItemsMuted}`} style={compact ? { lineHeight: 1.32 } : undefined}>{group.items.join("  ·  ")}</p>
              </div>
            ))}
          </div>

          <SidebarHeading title={L.education} compact={compact} />
          <div className={`${compact ? "mt-1" : "mt-1.5"} ${text.sidebarBody}`} style={compact ? { lineHeight: 1.4 } : undefined}>
            <p className={text.sidebarStrong}>{education.degree}</p>
            <p>{education.school}</p>
            <p>{education.period}</p>
            <p className="mt-1">
              <span className={text.sidebarStrong}>{education.internshipLabel}</span> {education.internship}
            </p>
          </div>

          <SidebarHeading title={L.languages} compact={compact} />
          <div className={`${compact ? "mt-1" : "mt-1.5"} ${text.sidebarBody}`} style={compact ? { lineHeight: 1.4 } : undefined}>
            {languages.map((entry) => (
              <p key={entry.language}>
                <span className={text.sidebarStrong}>{entry.language}</span> — {entry.level}
              </p>
            ))}
          </div>

          <div className={`mt-auto ${compact ? "pt-2" : "pt-4"}`}>
            <span className={`block h-px w-full ${color.hairlineBg}`} />
            <p className={`mt-2 ${text.footer}`}>{personalInfo.name}</p>
          </div>
        </aside>

        {/* ── main column ─────────────────────────────────── */}
        <div className="flex h-full flex-col" style={mainPad}>
          {highlights && highlights.length > 0 && (
            <section style={{ marginBottom: mm(compact ? 3 : gap.afterHighlights) }}>
              <SectionHeading title={L.whatIBring} />
              <div className={`${compact ? "mt-1 gap-x-2 gap-y-1" : "mt-1.5 gap-x-3 gap-y-1.5"} grid grid-cols-2`}>
                {highlights.map((h) => (
                  <div key={h.title} className="break-inside-avoid">
                    <p className={text.hlTitle}>{h.title}</p>
                    <p className={`mt-px ${text.hlDetail}`} style={compact ? { fontSize: "7.5px", lineHeight: 1.28 } : undefined}>{h.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <SectionHeading title={L.summary} />
          <div style={{ marginTop: mm(compact ? 1.8 : gap.afterHeading) }}>
            {summary.map((paragraph, index) => (
              <p
                key={index}
                className={text.lead}
                style={{
                  ...(compact ? { fontSize: "9.25px", lineHeight: 1.38 } : {}),
                  ...(index === 0 ? {} : { marginTop: mm(compact ? 1 : 1.6) }),
                }}
              >
                <Segments segments={paragraph} />
              </p>
            ))}
          </div>

          <SectionHeading title={L.experience} style={{ marginTop: mm(compact ? 4 : gap.beforeSection) }} />
          <div className="relative flex-1" style={{ marginTop: mm(compact ? 1.8 : gap.afterHeading) }}>
            <div className="absolute bottom-1 left-[3px] top-1 w-px bg-zinc-200" />
            <div className="flex flex-col" style={{ rowGap: mm(compact ? 1.7 : gap.betweenJobs) }}>
              {experience.map((job, index) => {
                const fade = job.current ? 1 : Math.max(1 - index * 0.05, 0.74);
                return (
                  <div
                    key={`${job.role}-${job.company}`}
                    className={`relative flex break-inside-avoid ${compact ? "gap-2 pl-4" : "gap-3 pl-5"}`}
                    style={{ opacity: fade }}
                  >
                    <span
                      className={`absolute left-0 top-[5px] h-2 w-2 rounded-full ring-4 ring-white ${
                        job.current ? "bg-teal-600" : "bg-zinc-300"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className={text.role} style={compact ? { fontSize: "10.5px", lineHeight: 1.12 } : undefined}>{job.role}</h3>
                      <p className={`mt-0.5 ${text.company}`}>
                        {job.company}
                        {job.current && <span className={`ml-1.5 ${text.current}`}>· Current</span>}
                      </p>
                      <ul
                        className="flex flex-col"
                        style={{
                          marginTop: mm(compact ? 0.7 : gap.jobHeadToBullets),
                          rowGap: mm(compact ? 0.2 : gap.betweenBullets),
                        }}
                      >
                        {job.bullets.map((bullet) => (
                          <li
                            key={bullet}
                            className={`flex items-start ${compact ? "gap-1" : "gap-1.5"} ${text.bullet}`}
                            style={compact ? { fontSize: "8.75px", lineHeight: 1.3 } : undefined}
                          >
                            <span className="mt-[6px] h-[3px] w-[3px] shrink-0 rounded-full bg-zinc-300" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`${compact ? "w-[23mm]" : "w-[26mm]"} shrink-0 text-right`}>
                      <p className={text.period}>{job.period}</p>
                      <p className={`mt-0.5 ${text.location}`}>{job.location}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`mt-auto ${compact ? "pt-1.5" : "pt-3"}`}>
            <span className={`block h-px w-full ${color.hairlineBg}`} />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className={`truncate ${text.footer}`}>{personalInfo.name}</p>
              <p className={`truncate ${text.footer}`}>{personalInfo.title}</p>
              <p className={`shrink-0 ${text.footer}`}>{L.documentType}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Compact, single-column layout for Oscar's early-career hospitality CV. */
function LinearCv({
  cv,
  sheetRef,
  labels: L,
}: {
  cv: CvData;
  sheetRef?: Ref<HTMLElement>;
  labels: typeof DEFAULT_LABELS;
}) {
  const { personalInfo, contactInfo, primarySkills, secondarySkills, education, languages, summary, experience } = cv;
  const section = "border-b border-zinc-200 pb-1 font-[family-name:var(--font-display)] text-[10px] font-bold uppercase tracking-[0.17em] text-zinc-900";
  const body = "text-[9px] leading-[1.45] text-zinc-700";
  return (
    <article ref={sheetRef} className={sheet.frame} style={sheet.style}>
      <div className={sheet.topRule} />
      <div className="flex h-full flex-col px-[17mm] pb-[12mm] pt-[16mm]">
        <header className="border-b-2 border-teal-600 pb-4">
          <h1 className="font-[family-name:var(--font-display)] text-[27px] font-bold leading-tight tracking-[-0.025em] text-zinc-900">{personalInfo.name}</h1>
          <p className="mt-1 text-[12px] font-semibold uppercase tracking-[0.16em] text-teal-700">{personalInfo.title}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[9px] text-zinc-500">
            {contactInfo.map((item) => <span key={item.text} className="inline-flex items-center gap-1.5"><item.icon size={11} />{item.text}</span>)}
            <span className="inline-flex items-center gap-1.5"><GraduationCap size={11} />Manipulación de Alimentos · Certificado</span>
          </div>
        </header>

        <section className="mt-4">
          <h2 className={section}>{L.summary}</h2>
          <div className="mt-2 space-y-1.5">
            {summary.map((paragraph, i) => <p key={i} className={body}><Segments segments={paragraph} /></p>)}
          </div>
        </section>

        <section className="mt-4">
          <h2 className={section}>{L.experience}</h2>
          <div className="mt-2.5 space-y-3">
            {experience.map((job) => <div key={`${job.role}-${job.company}`} className="break-inside-avoid">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[11px] font-bold text-zinc-900">{job.role} <span className="font-medium text-zinc-500">· {job.company}</span></h3>
                <p className="shrink-0 text-[8.5px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{job.period}</p>
              </div>
              <p className="mt-0.5 text-[8px] uppercase tracking-[0.08em] text-zinc-400">{job.location}</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 marker:text-teal-600">
                {job.bullets.map((bullet) => <li key={bullet} className={body}>{bullet}</li>)}
              </ul>
            </div>)}
          </div>
        </section>

        <section className="mt-4">
          <h2 className={section}>{L.coreSkills}</h2>
          <div className="mt-2 space-y-1.5">
            {[...primarySkills, ...secondarySkills].map((group) => <p key={group.label} className={body}>
              <span className="font-semibold text-zinc-900">{group.label}: </span>{group.items.join(" · ")}
            </p>)}
          </div>
        </section>

        <section className="mt-4">
          <h2 className={section}>{L.education}</h2>
          <div className="mt-2 flex flex-wrap justify-between gap-x-6 gap-y-1">
            <p className={body}><span className="font-semibold text-zinc-900">{education.degree}</span> · {education.school}</p>
            <p className={body}>{education.internshipLabel} {education.internship}</p>
          </div>
        </section>

        <section className="mt-4">
          <h2 className={section}>{L.languages}</h2>
          <p className="mt-2 text-[9px] text-zinc-700">{languages.map((entry) => `${entry.language} · ${entry.level}`).join("     |     ")}</p>
        </section>
        <footer className="mt-auto border-t border-zinc-200 pt-2 text-right text-[7px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Currículum · San Carlos, Costa Rica</footer>
      </div>
    </article>
  );
}

function Segments({ segments }: { segments: readonly SummarySegment[] }) {
  return (
    <>
      {segments.map((segment, index) => (
        <span
          key={index}
          className={
            segment.bold
              ? segment.accent
                ? "font-semibold text-teal-700"
                : "font-semibold text-zinc-900"
              : undefined
          }
        >
          {segment.text}
        </span>
      ))}
    </>
  );
}

function ContactItem({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: LucideIcon;
  label: string;
  href?: string;
  external?: boolean;
}) {
  const className = `flex items-center gap-1.5 ${text.contact} transition-colors hover:text-teal-700`;
  const content = (
    <>
      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-zinc-400">
        <Icon size={10} />
      </span>
      <span className="min-w-0 break-words">{label}</span>
    </>
  );

  if (!href) return <p className={className}>{content}</p>;
  return (
    <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={className}>
      {content}
    </a>
  );
}

function SidebarHeading({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <h2 className={`${compact ? "mt-2.5 pt-1.5" : "mt-4 pt-2.5"} border-t ${color.hairline} ${text.sidebarHeading}`}>
      {title}
    </h2>
  );
}

function SectionHeading({ title, style }: { title: string; style?: CSSProperties }) {
  return (
    <h2 className={`border-b ${color.hairline} pb-1 ${text.sectionHeading}`} style={style}>
      {title}
    </h2>
  );
}

/** First given name + first surname initials (falls back gracefully). */
function monogram(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 4) return (parts[0][0] + parts[2][0]).toUpperCase();
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
}
