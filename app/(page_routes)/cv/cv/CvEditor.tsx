"use client";

// ─────────────────────────────────────────────────────────────
// The /cv content editor — a structured, collapsible form for every part of the
// résumé. Lives in the workspace's left column while "editing" is on; the A4
// PrintPreview beside it re-renders live off the same materialised CvData.
// All persistence is handled by useEditableCv (per-variant, localStorage).
// ─────────────────────────────────────────────────────────────

import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Download,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { EditableCvApi } from "../useEditableCv";
import {
  blankContact,
  blankGroup,
  blankHighlight,
  blankJob,
  blankLanguage,
  CONTACT_ICON_LABEL,
  CONTACT_ICON_ORDER,
  type ContactIconKey,
  type EditableCv,
} from "../editableCv";

type Mutate = EditableCvApi["mutate"];

const inputCls =
  "w-full rounded border border-zinc-200 bg-white px-2 py-1 text-[11.5px] text-zinc-800 outline-none transition-colors focus:border-teal-500";
const areaCls =
  "w-full resize-y rounded border border-zinc-200 bg-white px-2 py-1 font-mono text-[11px] leading-relaxed text-zinc-800 outline-none transition-colors focus:border-teal-500";
const microLabel = "text-[9px] font-bold uppercase tracking-wide text-zinc-400";

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function clockOf(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// ── primitives ─────────────────────────────────────────────

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded p-1 transition-colors disabled:opacity-30 ${
        danger
          ? "text-zinc-400 hover:bg-rose-50 hover:text-rose-600"
          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-zinc-300 px-2 py-1.5 text-[10.5px] font-semibold text-zinc-500 transition-colors hover:border-teal-400 hover:text-teal-700"
    >
      <Plus size={12} />
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={microLabel}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-0.5 ${inputCls}`}
      />
    </label>
  );
}

function AreaField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: ReactNode;
}) {
  return (
    <label className="block">
      <span className={microLabel}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        placeholder={placeholder}
        className={`mt-0.5 ${areaCls}`}
      />
      {hint && <span className="mt-0.5 block text-[9.5px] leading-snug text-zinc-400">{hint}</span>}
    </label>
  );
}

function ItemBar({
  title,
  index,
  count,
  onUp,
  onDown,
  onRemove,
}: {
  title: string;
  index: number;
  count: number;
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
        {title} {index + 1}
      </span>
      <div className="flex items-center gap-0.5">
        <IconBtn label="Move up" disabled={index === 0} onClick={onUp}>
          <ChevronUp size={12} />
        </IconBtn>
        <IconBtn label="Move down" disabled={index === count - 1} onClick={onDown}>
          <ChevronDown size={12} />
        </IconBtn>
        <IconBtn label="Remove" danger onClick={onRemove}>
          <Trash2 size={12} />
        </IconBtn>
      </div>
    </div>
  );
}

function Section({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-3.5 py-2.5"
      >
        <span className="flex items-center gap-1.5">
          {open ? (
            <ChevronDown size={13} className="text-zinc-400" />
          ) : (
            <ChevronRight size={13} className="text-zinc-400" />
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">{title}</span>
        </span>
        {typeof count === "number" && (
          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-500">
            {count}
          </span>
        )}
      </button>
      {open && <div className="space-y-3 border-t border-zinc-100 px-3.5 py-3">{children}</div>}
    </section>
  );
}

// ── skills ─────────────────────────────────────────────────

function SkillBlock({
  heading,
  kind,
  cv,
  mutate,
}: {
  heading: string;
  kind: "primarySkills" | "secondarySkills";
  cv: EditableCv;
  mutate: Mutate;
}) {
  const groups = cv[kind];
  return (
    <div className="space-y-2">
      <p className={microLabel}>{heading}</p>
      {groups.map((g, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border border-zinc-200 p-2">
          <ItemBar
            title="Group"
            index={i}
            count={groups.length}
            onUp={() => mutate((d) => { d[kind] = move(d[kind], i, i - 1); })}
            onDown={() => mutate((d) => { d[kind] = move(d[kind], i, i + 1); })}
            onRemove={() => mutate((d) => { d[kind].splice(i, 1); })}
          />
          <Field
            label="Group label"
            value={g.label}
            onChange={(v) => mutate((d) => { d[kind][i].label = v; })}
          />
          <AreaField
            label="Items — one per line"
            rows={3}
            value={g.items.join("\n")}
            onChange={(v) => mutate((d) => { d[kind][i].items = v.split("\n"); })}
          />
        </div>
      ))}
      <AddBtn label="Add group" onClick={() => mutate((d) => { d[kind].push(blankGroup()); })} />
    </div>
  );
}

// ── one job ────────────────────────────────────────────────

function JobEditor({
  cv,
  index,
  mutate,
  open,
  onToggle,
}: {
  cv: EditableCv;
  index: number;
  mutate: Mutate;
  open: boolean;
  onToggle: () => void;
}) {
  const job = cv.experience[index];
  const count = cv.experience.length;
  return (
    <div className="rounded-lg border border-zinc-200">
      <div className="flex items-center justify-between gap-1 px-2 py-1.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
        >
          {open ? (
            <ChevronDown size={12} className="shrink-0 text-zinc-400" />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-zinc-400" />
          )}
          <span className="truncate text-[11px] font-semibold text-zinc-800">
            {job.role || job.company || `Job ${index + 1}`}
          </span>
          {job.current && (
            <span className="shrink-0 rounded bg-teal-100 px-1 text-[8.5px] font-bold uppercase tracking-wide text-teal-700">
              current
            </span>
          )}
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn
            label="Move up"
            disabled={index === 0}
            onClick={() => mutate((d) => { d.experience = move(d.experience, index, index - 1); })}
          >
            <ChevronUp size={12} />
          </IconBtn>
          <IconBtn
            label="Move down"
            disabled={index === count - 1}
            onClick={() => mutate((d) => { d.experience = move(d.experience, index, index + 1); })}
          >
            <ChevronDown size={12} />
          </IconBtn>
          <IconBtn
            label="Remove job"
            danger
            onClick={() => mutate((d) => { d.experience.splice(index, 1); })}
          >
            <Trash2 size={12} />
          </IconBtn>
        </div>
      </div>
      {open && (
        <div className="space-y-2 border-t border-zinc-100 px-2 py-2">
          <Field label="Role" value={job.role} onChange={(v) => mutate((d) => { d.experience[index].role = v; })} />
          <Field
            label="Company"
            value={job.company}
            onChange={(v) => mutate((d) => { d.experience[index].company = v; })}
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Field
                label="Period"
                value={job.period}
                placeholder="Apr 2026 – Present"
                onChange={(v) => mutate((d) => { d.experience[index].period = v; })}
              />
            </div>
            <div className="flex-1">
              <Field
                label="Location"
                value={job.location}
                placeholder="Remote · Costa Rica"
                onChange={(v) => mutate((d) => { d.experience[index].location = v; })}
              />
            </div>
          </div>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={job.current}
              onChange={(e) => mutate((d) => { d.experience[index].current = e.target.checked; })}
              className="h-3.5 w-3.5 accent-teal-600"
            />
            <span className="text-[10px] font-semibold text-zinc-600">Mark as current role</span>
          </label>
          <AreaField
            label="Bullets — one per line"
            rows={4}
            value={job.bullets.join("\n")}
            onChange={(v) => mutate((d) => { d.experience[index].bullets = v.split("\n"); })}
          />
        </div>
      )}
    </div>
  );
}

// ── main ───────────────────────────────────────────────────

const OPEN_KEY = "cv:editor:open-sections";
const DEFAULT_OPEN = ["identity", "summary", "experience"];

export function CvEditor({
  api,
  slug,
  variantName,
  onClose,
}: {
  api: EditableCvApi;
  slug: string;
  variantName: string;
  onClose: () => void;
}) {
  const { editable: cv, mutate } = api;

  const [openSet, setOpenSet] = useState<Set<string>>(() => new Set(DEFAULT_OPEN));
  const [openJobs, setOpenJobs] = useState<Set<number>>(() => new Set([0]));
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErr, setImportErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OPEN_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setOpenSet(new Set(arr.filter((x) => typeof x === "string")));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSection = (id: string) =>
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(OPEN_KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });

  const toggleJob = (i: number) =>
    setOpenJobs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const handleExport = () => {
    const json = api.exportJson();
    try {
      navigator.clipboard?.writeText(json);
    } catch {
      /* ignore */
    }
    try {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cv-${slug || "base"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      /* ignore */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    if (
      window.confirm(`Discard every edit to the “${variantName}” résumé and restore the committed default?`)
    ) {
      api.reset();
      setOpenJobs(new Set([0]));
    }
  };

  const doImport = () => {
    const res = api.importJson(importText);
    if (res.ok) {
      setImportOpen(false);
      setImportText("");
      setImportErr(null);
      setOpenJobs(new Set([0]));
    } else {
      setImportErr(res.error);
    }
  };

  const markupHint = (
    <>
      <span className="rounded bg-zinc-100 px-1 text-zinc-600">**bold**</span> for emphasis ·{" "}
      <span className="rounded bg-zinc-100 px-1 text-zinc-600">**!teal**</span> for the accent colour
    </>
  );

  return (
    <div className="space-y-3">
      {/* header */}
      <div className="rounded-xl border border-teal-500/60 bg-teal-50/60 p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Pencil size={13} className="text-teal-700" />
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-teal-900">Edit content</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full border border-teal-600 bg-white px-2.5 py-1 text-[11px] font-semibold text-teal-700 transition-colors hover:bg-teal-600 hover:text-white"
          >
            <Check size={12} />
            Done
          </button>
        </div>
        <p className="mt-1 text-[10.5px] leading-snug text-teal-800/80">
          Editing <span className="font-semibold">{variantName}</span> — the A4 preview updates live and
          autosaves to this browser.
        </p>
        <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide">
          {api.status === "saving" ? (
            <span className="text-amber-600">Saving…</span>
          ) : api.status === "saved" ? (
            <span className="text-teal-700">Saved{api.savedAt ? ` · ${clockOf(api.savedAt)}` : ""}</span>
          ) : (
            <span className="text-zinc-400">No changes yet</span>
          )}
        </div>
      </div>

      {/* identity */}
      <Section title="Identity" open={openSet.has("identity")} onToggle={() => toggleSection("identity")}>
        <Field
          label="Full name"
          value={cv.personalInfo.name}
          onChange={(v) => mutate((d) => { d.personalInfo.name = v; })}
        />
        <Field
          label="Headline / title"
          value={cv.personalInfo.title}
          onChange={(v) => mutate((d) => { d.personalInfo.title = v; })}
        />
      </Section>

      {/* contact */}
      <Section
        title="Contact"
        count={cv.contactInfo.length}
        open={openSet.has("contact")}
        onToggle={() => toggleSection("contact")}
      >
        {cv.contactInfo.map((c, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border border-zinc-200 p-2">
            <ItemBar
              title="Entry"
              index={i}
              count={cv.contactInfo.length}
              onUp={() => mutate((d) => { d.contactInfo = move(d.contactInfo, i, i - 1); })}
              onDown={() => mutate((d) => { d.contactInfo = move(d.contactInfo, i, i + 1); })}
              onRemove={() => mutate((d) => { d.contactInfo.splice(i, 1); })}
            />
            <label className="block">
              <span className={microLabel}>Icon</span>
              <select
                value={c.icon}
                onChange={(e) =>
                  mutate((d) => { d.contactInfo[i].icon = e.target.value as ContactIconKey; })
                }
                className={`mt-0.5 ${inputCls}`}
              >
                {CONTACT_ICON_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {CONTACT_ICON_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Text" value={c.text} onChange={(v) => mutate((d) => { d.contactInfo[i].text = v; })} />
            <Field
              label="Link (optional)"
              value={c.href}
              placeholder="mailto:… · tel:… · https://…"
              onChange={(v) => mutate((d) => { d.contactInfo[i].href = v; })}
            />
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={c.external}
                onChange={(e) => mutate((d) => { d.contactInfo[i].external = e.target.checked; })}
                className="h-3.5 w-3.5 accent-teal-600"
              />
              <span className="text-[10px] font-semibold text-zinc-600">Open in a new tab</span>
            </label>
          </div>
        ))}
        <AddBtn
          label="Add contact entry"
          onClick={() => mutate((d) => { d.contactInfo.push(blankContact()); })}
        />
      </Section>

      {/* summary */}
      <Section
        title="Professional summary"
        count={cv.summary.length}
        open={openSet.has("summary")}
        onToggle={() => toggleSection("summary")}
      >
        <p className="text-[9.5px] leading-snug text-zinc-400">One paragraph per box. {markupHint}.</p>
        {cv.summary.map((para, i) => (
          <div key={i} className="space-y-1 rounded-lg border border-zinc-200 p-2">
            <ItemBar
              title="Paragraph"
              index={i}
              count={cv.summary.length}
              onUp={() => mutate((d) => { d.summary = move(d.summary, i, i - 1); })}
              onDown={() => mutate((d) => { d.summary = move(d.summary, i, i + 1); })}
              onRemove={() => mutate((d) => { d.summary.splice(i, 1); })}
            />
            <textarea
              value={para}
              onChange={(e) => mutate((d) => { d.summary[i] = e.target.value; })}
              rows={3}
              spellCheck={false}
              className={`mt-0.5 ${areaCls}`}
            />
          </div>
        ))}
        <AddBtn label="Add paragraph" onClick={() => mutate((d) => { d.summary.push(""); })} />
      </Section>

      {/* highlights */}
      <Section
        title="“What I Bring” highlights"
        count={cv.highlights.length}
        open={openSet.has("highlights")}
        onToggle={() => toggleSection("highlights")}
      >
        <p className="text-[9.5px] leading-snug text-zinc-400">
          Strengths band above the summary. The résumé shows it only when there’s at least one — the God CV
          uses it; tailored variants usually leave it empty.
        </p>
        {cv.highlights.map((h, i) => (
          <div key={i} className="space-y-1.5 rounded-lg border border-zinc-200 p-2">
            <ItemBar
              title="Highlight"
              index={i}
              count={cv.highlights.length}
              onUp={() => mutate((d) => { d.highlights = move(d.highlights, i, i - 1); })}
              onDown={() => mutate((d) => { d.highlights = move(d.highlights, i, i + 1); })}
              onRemove={() => mutate((d) => { d.highlights.splice(i, 1); })}
            />
            <Field label="Title" value={h.title} onChange={(v) => mutate((d) => { d.highlights[i].title = v; })} />
            <AreaField
              label="Detail"
              rows={2}
              value={h.detail}
              onChange={(v) => mutate((d) => { d.highlights[i].detail = v; })}
            />
          </div>
        ))}
        <AddBtn label="Add highlight" onClick={() => mutate((d) => { d.highlights.push(blankHighlight()); })} />
      </Section>

      {/* skills */}
      <Section
        title="Skills"
        count={cv.primarySkills.length + cv.secondarySkills.length}
        open={openSet.has("skills")}
        onToggle={() => toggleSection("skills")}
      >
        <SkillBlock heading="Core skills · accent labels" kind="primarySkills" cv={cv} mutate={mutate} />
        <SkillBlock heading="Secondary skills · muted labels" kind="secondarySkills" cv={cv} mutate={mutate} />
      </Section>

      {/* experience */}
      <Section
        title="Experience"
        count={cv.experience.length}
        open={openSet.has("experience")}
        onToggle={() => toggleSection("experience")}
      >
        <div className="space-y-2">
          {cv.experience.map((_, i) => (
            <JobEditor
              key={i}
              cv={cv}
              index={i}
              mutate={mutate}
              open={openJobs.has(i)}
              onToggle={() => toggleJob(i)}
            />
          ))}
        </div>
        <AddBtn
          label="Add job"
          onClick={() => {
            const at = cv.experience.length;
            mutate((d) => { d.experience.push(blankJob()); });
            setOpenJobs((prev) => new Set(prev).add(at));
          }}
        />
      </Section>

      {/* education + languages */}
      <Section
        title="Education & languages"
        open={openSet.has("education")}
        onToggle={() => toggleSection("education")}
      >
        <Field
          label="Degree"
          value={cv.education.degree}
          onChange={(v) => mutate((d) => { d.education.degree = v; })}
        />
        <Field
          label="School"
          value={cv.education.school}
          onChange={(v) => mutate((d) => { d.education.school = v; })}
        />
        <Field
          label="Period"
          value={cv.education.period}
          onChange={(v) => mutate((d) => { d.education.period = v; })}
        />
        <Field
          label="Project label"
          value={cv.education.internshipLabel}
          onChange={(v) => mutate((d) => { d.education.internshipLabel = v; })}
        />
        <Field
          label="Project / internship"
          value={cv.education.internship}
          onChange={(v) => mutate((d) => { d.education.internship = v; })}
        />
        <div className="pt-1">
          <span className={microLabel}>Languages</span>
          <div className="mt-1 space-y-1.5">
            {cv.languages.map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  value={l.language}
                  placeholder="Language"
                  onChange={(e) => mutate((d) => { d.languages[i].language = e.target.value; })}
                  className={`${inputCls} flex-1`}
                />
                <input
                  value={l.level}
                  placeholder="Level"
                  onChange={(e) => mutate((d) => { d.languages[i].level = e.target.value; })}
                  className={`${inputCls} flex-[1.6]`}
                />
                <IconBtn
                  label="Remove language"
                  danger
                  onClick={() => mutate((d) => { d.languages.splice(i, 1); })}
                >
                  <Trash2 size={12} />
                </IconBtn>
              </div>
            ))}
          </div>
          <div className="mt-1.5">
            <AddBtn
              label="Add language"
              onClick={() => mutate((d) => { d.languages.push(blankLanguage()); })}
            />
          </div>
        </div>
      </Section>

      {/* data actions */}
      <div className="space-y-2 rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-[10.5px] font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
          >
            {copied ? <Check size={12} /> : <Download size={12} />}
            {copied ? "Copied + saved" : "Export JSON"}
          </button>
          <button
            type="button"
            onClick={() => {
              setImportErr(null);
              setImportText("");
              setImportOpen(true);
            }}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-[10.5px] font-semibold text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
          >
            <Upload size={12} />
            Import JSON
          </button>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1.5 text-[10.5px] font-semibold text-rose-600 transition-colors hover:bg-rose-50"
        >
          <RotateCcw size={12} />
          Reset to the {variantName} default
        </button>
        <p className="text-[10px] leading-snug text-zinc-400">
          {api.isEdited
            ? "Saved in this browser only — not committed to the repo."
            : "Unedited — currently matches the committed default."}{" "}
          Each variant keeps its own copy.
        </p>
      </div>

      {importOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
          onClick={() => setImportOpen(false)}
        >
          <div
            className="mt-16 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-900">Import CV JSON</h3>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X size={14} />
              </button>
            </div>
            <p className="mt-1 text-[10.5px] leading-snug text-zinc-400">
              Paste a JSON export. Replaces the current “{variantName}” content (autosaved immediately).
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder='{ "personalInfo": { "name": "…", "title": "…" }, … }'
              className={`mt-2 ${areaCls}`}
            />
            {importErr && <p className="mt-1 text-[10.5px] font-medium text-rose-600">{importErr}</p>}
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doImport}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-teal-700"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
