"use client";

// ─────────────────────────────────────────────────────────────
// React binding for the /cv content editor.
//
// Per-variant overrides live in localStorage (key: cv:edits:v1:<slug>). The
// route's data module is the SEED / default; once you edit, the stored blob
// shadows it until you "Reset". SSR-safe (starts from the seed, hydrates in an
// effect), debounced autosave, and cross-tab sync via the `storage` event.
// ─────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CvData } from "./types";
import { coerceEditable, materialize, toEditable, type EditableCv } from "./editableCv";

const storageKeyFor = (slug: string) => `cv:edits:v1:${slug || "base"}`;
const DEBOUNCE_MS = 500;

export type EditStatus = "clean" | "saving" | "saved";

export type EditableCvApi = {
  ready: boolean;
  /** materialised — feed the preview, the JD audit, the cover letter */
  cv: CvData;
  /** raw editable model — feed the editor form */
  editable: EditableCv;
  /** overrides exist in storage for this variant */
  isEdited: boolean;
  status: EditStatus;
  savedAt: number | null;
  mutate: (fn: (draft: EditableCv) => void) => void;
  reset: () => void;
  replace: (next: EditableCv) => void;
  exportJson: () => string;
  importJson: (text: string) => { ok: true } | { ok: false; error: string };
};

function cloneEditable(ec: EditableCv): EditableCv {
  try {
    return structuredClone(ec);
  } catch {
    return JSON.parse(JSON.stringify(ec)) as EditableCv;
  }
}

export function useEditableCv(slug: string, base: CvData): EditableCvApi {
  const storageKey = storageKeyFor(slug);

  // the committed default for this variant — stable for the life of the mount
  // (navigating to another variant is a route change → fresh mount).
  const seedRef = useRef<EditableCv | null>(null);
  if (seedRef.current === null) seedRef.current = toEditable(base);
  const seed = seedRef.current;

  const [editable, setEditable] = useState<EditableCv>(seed);
  const [isEdited, setIsEdited] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<EditStatus>("clean");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const editableRef = useRef(editable);
  useEffect(() => {
    editableRef.current = editable;
  }, [editable]);

  const timerRef = useRef<number | undefined>(undefined);
  const clearTimer = () => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  // hydrate from storage (re-runs if the variant changes without a remount)
  useEffect(() => {
    let loaded: EditableCv | null = null;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) loaded = coerceEditable(JSON.parse(raw));
    } catch {
      loaded = null;
    }
    const next = loaded ?? seed;
    editableRef.current = next;
    setEditable(next);
    setIsEdited(loaded !== null);
    setStatus(loaded !== null ? "saved" : "clean");
    setSavedAt(null);
    setReady(true);
    return clearTimer;
  }, [storageKey, seed]);

  // cross-tab sync
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== storageKey) return;
      let loaded: EditableCv | null = null;
      try {
        loaded = e.newValue ? coerceEditable(JSON.parse(e.newValue)) : null;
      } catch {
        loaded = null;
      }
      const next = loaded ?? seed;
      editableRef.current = next;
      setEditable(next);
      setIsEdited(loaded !== null);
      setStatus(loaded !== null ? "saved" : "clean");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storageKey, seed]);

  const persist = useCallback(
    (ec: EditableCv) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(ec));
        setIsEdited(true);
        setSavedAt(Date.now());
        setStatus("saved");
      } catch {
        setStatus("clean");
      }
    },
    [storageKey],
  );

  const mutate = useCallback(
    (fn: (draft: EditableCv) => void) => {
      const draft = cloneEditable(editableRef.current);
      fn(draft);
      editableRef.current = draft;
      setEditable(draft);
      setStatus("saving");
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = undefined;
        persist(draft);
      }, DEBOUNCE_MS);
    },
    [persist],
  );

  const replace = useCallback(
    (next: EditableCv) => {
      const copy = cloneEditable(next);
      editableRef.current = copy;
      setEditable(copy);
      clearTimer();
      persist(copy);
    },
    [persist],
  );

  const reset = useCallback(() => {
    clearTimer();
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
    editableRef.current = seed;
    setEditable(seed);
    setIsEdited(false);
    setStatus("clean");
    setSavedAt(null);
  }, [seed, storageKey]);

  const exportJson = useCallback(() => JSON.stringify(editable, null, 2), [editable]);

  const importJson = useCallback(
    (text: string): { ok: true } | { ok: false; error: string } => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return { ok: false, error: "That isn't valid JSON." };
      }
      const coerced = coerceEditable(parsed);
      if (!coerced) {
        return {
          ok: false,
          error: "This JSON doesn't look like a CV export (missing personalInfo / sections).",
        };
      }
      replace(coerced);
      return { ok: true };
    },
    [replace],
  );

  const cv = useMemo(() => materialize(editable), [editable]);

  return {
    ready,
    cv,
    editable,
    isEdited,
    status,
    savedAt,
    mutate,
    reset,
    replace,
    exportJson,
    importJson,
  };
}
