"use client";

import { Music2, Trash2, Upload } from "lucide-react";
import { memo, useState } from "react";

import { AUDIO_FILE_ACCEPT } from "../lib/constants";
import { formatTime } from "../lib/format";
import { PanelTitle } from "./ui";
import type { SamplePoolProps } from "../props";

/** Drop zone + the decoded source clips every layer draws from. */
export const SamplePool = memo(function SamplePool({ samples, onAddFiles, onRemove }: SamplePoolProps) {
  const [dragActive, setDragActive] = useState(false);

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl">
      <PanelTitle eyebrow="Source pool" title="Samples" icon={<Music2 className="text-emerald-200" size={26} />} />

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          onAddFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 text-center transition ${
          dragActive
            ? "border-emerald-200 bg-emerald-300/20"
            : "border-emerald-300/35 bg-emerald-300/10 hover:bg-emerald-300/15"
        }`}
      >
        <Upload className="mb-2 text-emerald-100" />
        <span className="text-sm font-black text-white">Drop or pick MP3 / WAV / M4A</span>
        <span className="mt-1 text-xs text-slate-400">Files stay in your browser — nothing is uploaded.</span>
        <input
          className="sr-only"
          type="file"
          accept={AUDIO_FILE_ACCEPT}
          multiple
          onChange={(e) => onAddFiles(e.target.files)}
        />
      </label>

      {samples.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {samples.map((sample) => (
            <div key={sample.id} className="flex items-center gap-3 rounded-md border border-white/10 bg-black/30 p-3">
              <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: sample.color }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-white">{sample.name}</span>
                <span className="text-xs text-slate-500">
                  {formatTime(sample.duration)} · {sample.buffer.sampleRate / 1000} kHz
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(sample.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.05] text-slate-300 transition hover:border-red-300/50 hover:text-red-200"
                title="Remove sample"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
});
