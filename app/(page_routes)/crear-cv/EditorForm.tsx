"use client";

import { useState } from "react";
import {
  ChevronDown,
  GripVertical,
  Plus,
  Trash2,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Wrench,
  Languages as LanguagesIcon,
  FolderGit2,
  Link2,
  Quote,
} from "lucide-react";
import type { ResumeData } from "./types";
import { uid } from "./sample";
import type { UiStrings } from "./i18n";

type ListKey = "experience" | "education" | "skills" | "languages" | "projects" | "links";

export function EditorForm({
  data,
  onChange,
  ui,
}: {
  data: ResumeData;
  onChange: (patch: Partial<ResumeData>) => void;
  ui: UiStrings;
}) {
  const set = <K extends keyof ResumeData>(key: K, value: ResumeData[K]) =>
    onChange({ [key]: value } as Partial<ResumeData>);

  function updateItem(key: ListKey, id: string, patch: Record<string, unknown>) {
    set(
      key,
      (data[key] as { id: string }[]).map((it) =>
        it.id === id ? { ...it, ...patch } : it,
      ) as ResumeData[ListKey],
    );
  }
  function addItem(key: ListKey, blank: Record<string, unknown>) {
    set(key, [...(data[key] as unknown[]), { id: uid(key.slice(0, 3)), ...blank }] as ResumeData[ListKey]);
  }
  function removeItem(key: ListKey, id: string) {
    set(key, (data[key] as { id: string }[]).filter((it) => it.id !== id) as ResumeData[ListKey]);
  }
  function moveItem(key: ListKey, id: string, dir: -1 | 1) {
    const list = [...(data[key] as { id: string }[])];
    const i = list.findIndex((it) => it.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set(key, list as ResumeData[ListKey]);
  }

  return (
    <div className="space-y-2.5">
      {/* ── personal ── */}
      <Section title={ui.personal} icon={<User size={15} />} defaultOpen>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Field label={ui.fullName} value={data.fullName} onChange={(v) => set("fullName", v)} />
          <Field label={ui.headline} value={data.headline} onChange={(v) => set("headline", v)} />
          <Field label={ui.email} value={data.email} onChange={(v) => set("email", v)} type="email" />
          <Field label={ui.phone} value={data.phone} onChange={(v) => set("phone", v)} />
          <Field label={ui.locationField} value={data.location} onChange={(v) => set("location", v)} />
          <Field label={`${ui.website} (${ui.optional})`} value={data.website} onChange={(v) => set("website", v)} />
        </div>
      </Section>

      {/* ── links ── */}
      <Section title={ui.links} icon={<Link2 size={15} />} count={data.links.length}>
        <ListEditor
          items={data.links}
          onAdd={() => addItem("links", { label: "", url: "" })}
          onRemove={(id) => removeItem("links", id)}
          onMove={(id, d) => moveItem("links", id, d)}
          ui={ui}
          render={(it) => (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label={ui.linkLabel} value={it.label} onChange={(v) => updateItem("links", it.id, { label: v })} placeholder="LinkedIn / GitHub / Portafolio" />
              <Field label={ui.linkUrl} value={it.url} onChange={(v) => updateItem("links", it.id, { url: v })} placeholder="linkedin.com/in/…" />
            </div>
          )}
        />
      </Section>

      {/* ── summary ── */}
      <Section title={ui.summary} icon={<FileText size={15} />} defaultOpen>
        <Area
          label=""
          value={data.summary}
          onChange={(v) => set("summary", v)}
          rows={5}
          placeholder={ui.summaryPlaceholder}
        />
      </Section>

      {/* ── experience ── */}
      <Section title={ui.experience} icon={<Briefcase size={15} />} count={data.experience.length} defaultOpen>
        <ListEditor
          items={data.experience}
          onAdd={() =>
            addItem("experience", {
              role: "",
              company: "",
              location: "",
              start: "",
              end: "",
              current: false,
              bullets: [""],
            })
          }
          onRemove={(id) => removeItem("experience", id)}
          onMove={(id, d) => moveItem("experience", id, d)}
          ui={ui}
          render={(it) => (
            <div className="space-y-2.5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Field label={ui.role} value={it.role} onChange={(v) => updateItem("experience", it.id, { role: v })} />
                <Field label={ui.company} value={it.company} onChange={(v) => updateItem("experience", it.id, { company: v })} />
                <Field label={ui.place} value={it.location} onChange={(v) => updateItem("experience", it.id, { location: v })} />
                <div className="grid grid-cols-2 gap-2.5">
                  <Field label={ui.start} value={it.start} onChange={(v) => updateItem("experience", it.id, { start: v })} placeholder="Ene 2022" />
                  <Field
                    label={ui.end}
                    value={it.end}
                    onChange={(v) => updateItem("experience", it.id, { end: v })}
                    placeholder="Dic 2023"
                    disabled={it.current}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-[12px] font-medium text-zinc-600">
                <input
                  type="checkbox"
                  checked={it.current}
                  onChange={(e) => updateItem("experience", it.id, { current: e.target.checked })}
                  className="h-3.5 w-3.5 accent-teal-600"
                />
                {ui.current}
              </label>
              <Area
                label={ui.bullets}
                value={it.bullets.join("\n")}
                onChange={(v) => updateItem("experience", it.id, { bullets: v.split("\n") })}
                rows={4}
                mono
              />
            </div>
          )}
        />
      </Section>

      {/* ── education ── */}
      <Section title={ui.education} icon={<GraduationCap size={15} />} count={data.education.length}>
        <ListEditor
          items={data.education}
          onAdd={() =>
            addItem("education", { degree: "", school: "", location: "", start: "", end: "", note: "" })
          }
          onRemove={(id) => removeItem("education", id)}
          onMove={(id, d) => moveItem("education", id, d)}
          ui={ui}
          render={(it) => (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label={ui.degree} value={it.degree} onChange={(v) => updateItem("education", it.id, { degree: v })} />
              <Field label={ui.school} value={it.school} onChange={(v) => updateItem("education", it.id, { school: v })} />
              <Field label={ui.place} value={it.location} onChange={(v) => updateItem("education", it.id, { location: v })} />
              <div className="grid grid-cols-2 gap-2.5">
                <Field label={ui.start} value={it.start} onChange={(v) => updateItem("education", it.id, { start: v })} placeholder="2016" />
                <Field label={ui.end} value={it.end} onChange={(v) => updateItem("education", it.id, { end: v })} placeholder="2018" />
              </div>
              <div className="sm:col-span-2">
                <Field label={`${ui.eduNote} (${ui.optional})`} value={it.note} onChange={(v) => updateItem("education", it.id, { note: v })} />
              </div>
            </div>
          )}
        />
      </Section>

      {/* ── skills ── */}
      <Section title={ui.skills} icon={<Wrench size={15} />} count={data.skills.length} defaultOpen>
        <ListEditor
          items={data.skills}
          onAdd={() => addItem("skills", { label: "", items: [] })}
          onRemove={(id) => removeItem("skills", id)}
          onMove={(id, d) => moveItem("skills", id, d)}
          ui={ui}
          render={(it) => (
            <div className="space-y-2.5">
              <Field label={ui.skillGroup} value={it.label} onChange={(v) => updateItem("skills", it.id, { label: v })} placeholder="Herramientas / Fortalezas / Técnicas" />
              <Area
                label={ui.skillItems}
                value={it.items.join("\n")}
                onChange={(v) => updateItem("skills", it.id, { items: v.split("\n") })}
                rows={3}
                mono
              />
            </div>
          )}
        />
      </Section>

      {/* ── languages ── */}
      <Section title={ui.languages} icon={<LanguagesIcon size={15} />} count={data.languages.length}>
        <ListEditor
          items={data.languages}
          onAdd={() => addItem("languages", { name: "", level: "" })}
          onRemove={(id) => removeItem("languages", id)}
          onMove={(id, d) => moveItem("languages", id, d)}
          ui={ui}
          render={(it) => (
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Field label={ui.languageName} value={it.name} onChange={(v) => updateItem("languages", it.id, { name: v })} />
              <Field label={ui.languageLevel} value={it.level} onChange={(v) => updateItem("languages", it.id, { level: v })} placeholder="Nativo / B2 / Avanzado" />
            </div>
          )}
        />
      </Section>

      {/* ── projects ── */}
      <Section title={`${ui.projects} (${ui.optional})`} icon={<FolderGit2 size={15} />} count={data.projects.length}>
        <ListEditor
          items={data.projects}
          onAdd={() => addItem("projects", { name: "", description: "", url: "" })}
          onRemove={(id) => removeItem("projects", id)}
          onMove={(id, d) => moveItem("projects", id, d)}
          ui={ui}
          render={(it) => (
            <div className="space-y-2.5">
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Field label={ui.projectName} value={it.name} onChange={(v) => updateItem("projects", it.id, { name: v })} />
                <Field label={ui.projectUrl} value={it.url} onChange={(v) => updateItem("projects", it.id, { url: v })} />
              </div>
              <Field label={ui.projectDesc} value={it.description} onChange={(v) => updateItem("projects", it.id, { description: v })} />
            </div>
          )}
        />
      </Section>

      {/* ── references ── */}
      <Section title={`${ui.references} (${ui.optional})`} icon={<Quote size={15} />}>
        <Field
          label=""
          value={data.references}
          onChange={(v) => set("references", v)}
          placeholder={ui.referencesPlaceholder}
        />
      </Section>
    </div>
  );
}

// ── primitives ──────────────────────────────────────────────

function Section({
  title,
  icon,
  count,
  defaultOpen,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3.5 py-3 text-left"
      >
        <span className="text-teal-600">{icon}</span>
        <span className="text-[13px] font-bold text-zinc-800">{title}</span>
        {count != null && count > 0 && (
          <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-500">
            {count}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`ml-auto shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-zinc-100 p-3.5">{children}</div>}
    </div>
  );
}

function ListEditor<T extends { id: string }>({
  items,
  onAdd,
  onRemove,
  onMove,
  render,
  ui,
}: {
  items: T[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  render: (item: T) => React.ReactNode;
  ui: UiStrings;
}) {
  return (
    <div className="space-y-2.5">
      {items.map((it, idx) => (
        <div key={it.id} className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
          <div className="mb-2 flex items-center gap-1">
            <GripVertical size={13} className="text-zinc-300" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-400">#{idx + 1}</span>
            <div className="ml-auto flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onMove(it.id, -1)}
                disabled={idx === 0}
                title={ui.moveUp}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-30"
              >
                <ChevronDown size={13} className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => onMove(it.id, 1)}
                disabled={idx === items.length - 1}
                title={ui.moveDown}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-30"
              >
                <ChevronDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                title={ui.remove}
                className="rounded p-1 text-zinc-400 hover:bg-rose-100 hover:text-rose-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          {render(it)}
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-[12px] font-semibold text-zinc-500 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700"
      >
        <Plus size={13} />
        {ui.addItem}
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </span>
      )}
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:bg-zinc-100 disabled:text-zinc-400"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          {label}
        </span>
      )}
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 ${
          mono ? "font-[family-name:var(--font-mono)] text-[12px]" : ""
        }`}
      />
    </label>
  );
}
