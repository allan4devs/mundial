"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  emptySignLayout,
  hasStoredAnchors,
  loadSignLayout,
  removeSignLayout,
  saveSignLayout,
} from "./storage";
import {
  addedElementGroupId,
  localize,
  type AddedCanvasElement,
  type AddedIconElement,
  type AddedImageElement,
  type AddedTextElement,
  type AddedTextStyle,
  type InsertableIconKey,
  type Lang,
  type LocalizedText,
  type PanelLayoutRevision,
  type StoredGroupLayout,
  type StoredPanelLayout,
  type StoredSignLayout,
} from "./types";

const MAX_ADDED_ELEMENTS = 48;
const EMPTY_ADDED_ELEMENTS: readonly AddedCanvasElement[] = Object.freeze([]);
let fallbackElementSequence = 0;

type AddedElementDraft =
  | Omit<AddedTextElement, "id">
  | Omit<AddedIconElement, "id">
  | Omit<AddedImageElement, "id">;

export type SelectedLayoutObject = {
  panelId: string;
  groupId: string;
};

export type SignLayoutEditorContextValue = {
  signId: string;
  lang: Lang;
  isEditing: boolean;
  layoutEpoch: number;
  selectedObject: SelectedLayoutObject | null;
  selectObject: (panelId: string, groupId: string | null) => void;
  getGroupLayout: (
    panelId: string,
    revision: PanelLayoutRevision,
    groupId: string,
  ) => StoredGroupLayout | null;
  commitGroupLayout: (
    panelId: string,
    revision: PanelLayoutRevision,
    groupId: string,
    groupLayout: StoredGroupLayout,
  ) => boolean;
  resetGroup: (panelId: string, revision: PanelLayoutRevision, groupId: string) => boolean;
  getAddedElements: (
    panelId: string,
    revision: PanelLayoutRevision,
  ) => readonly AddedCanvasElement[];
  addTextElement: (
    panelId: string,
    revision: PanelLayoutRevision,
    style?: AddedTextStyle,
  ) => string | null;
  addIconElement: (
    panelId: string,
    revision: PanelLayoutRevision,
    icon: InsertableIconKey,
  ) => string | null;
  addImageElement: (
    panelId: string,
    revision: PanelLayoutRevision,
    src: string,
    aspectRatio: number,
  ) => string | null;
  updateAddedElement: (
    panelId: string,
    revision: PanelLayoutRevision,
    element: AddedCanvasElement,
  ) => boolean;
  removeAddedElement: (
    panelId: string,
    revision: PanelLayoutRevision,
    elementId: string,
  ) => boolean;
  duplicateAddedElement: (
    panelId: string,
    revision: PanelLayoutRevision,
    elementId: string,
  ) => string | null;
  bringAddedElementToFront: (
    panelId: string,
    revision: PanelLayoutRevision,
    elementId: string,
  ) => boolean;
  sendAddedElementToBack: (
    panelId: string,
    revision: PanelLayoutRevision,
    elementId: string,
  ) => boolean;
  getHiddenGroupCount: (panelId: string, revision: PanelLayoutRevision) => number;
  restoreHiddenGroups: (panelId: string, revision: PanelLayoutRevision) => number;
  announce: (message: string) => void;
};

const SignLayoutEditorContext = createContext<SignLayoutEditorContextValue | null>(null);

export function useSignLayoutEditor(): SignLayoutEditorContextValue {
  const value = useContext(SignLayoutEditorContext);
  if (!value) {
    throw new Error("EditableSignCanvas must be rendered inside SignLayoutEditor.");
  }
  return value;
}

export type SignLayoutEditorProps = {
  signId: string;
  signLabel: LocalizedText;
  lang: Lang;
  children: ReactNode;
  className?: string;
};

type LiveAnnouncement = {
  sequence: number;
  message: string;
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function createElementId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  fallbackElementSequence += 1;
  return `e${Date.now().toString(36)}${fallbackElementSequence.toString(36)}`;
}

function compatiblePanel(
  layout: StoredSignLayout,
  panelId: string,
  revision: PanelLayoutRevision,
): StoredPanelLayout {
  const panel = layout.panels[panelId];
  return panel?.revision === revision
    ? panel
    : { revision, groups: {}, elements: [] };
}

function withPanel(
  layout: StoredSignLayout,
  panelId: string,
  panel: StoredPanelLayout,
): StoredSignLayout {
  return {
    ...layout,
    panels: {
      ...layout.panels,
      [panelId]: panel,
    },
  };
}

function withoutEmptyPanel(
  layout: StoredSignLayout,
  panelId: string,
  panel: StoredPanelLayout,
): StoredSignLayout {
  if (Object.keys(panel.groups).length > 0 || panel.elements.length > 0) {
    return withPanel(layout, panelId, panel);
  }

  const panels = { ...layout.panels };
  delete panels[panelId];
  return { ...layout, panels };
}

function normalizedGroupLayout(groupLayout: StoredGroupLayout): StoredGroupLayout {
  return {
    anchor: {
      x: clamp(groupLayout.anchor.x, 0, 1),
      y: clamp(groupLayout.anchor.y, 0, 1),
    },
    scale: clamp(groupLayout.scale, 0.2, 4),
    ...(groupLayout.hidden ? { hidden: true } : {}),
    ...(groupLayout.text ? { text: groupLayout.text } : {}),
  };
}

export default function SignLayoutEditor({
  signId,
  signLabel,
  lang,
  children,
  className = "",
}: SignLayoutEditorProps) {
  const storageRef = useRef<Storage | null>(null);
  const layoutRef = useRef<StoredSignLayout>(emptySignLayout(signId));
  const [layoutEpoch, bumpLayoutEpoch] = useReducer((value: number) => value + 1, 0);
  const [hasCustomLayout, setHasCustomLayout] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedObject, setSelectedObject] = useState<SelectedLayoutObject | null>(null);
  const [persistenceUnavailable, setPersistenceUnavailable] = useState(false);
  const [announcement, setAnnouncement] = useState<LiveAnnouncement>({ sequence: 0, message: "" });
  const headingId = useId();
  const resolvedSignLabel = localize(signLabel, lang);

  const announce = useCallback((message: string) => {
    setAnnouncement((current) => ({ sequence: current.sequence + 1, message }));
  }, []);

  const publishLayout = useCallback((nextLayout: StoredSignLayout) => {
    layoutRef.current = nextLayout;
    const storage = storageRef.current;
    const hasChanges = hasStoredAnchors(nextLayout);
    const persisted = storage
      ? hasChanges
        ? saveSignLayout(storage, nextLayout)
        : removeSignLayout(storage, nextLayout.signId)
      : false;

    setPersistenceUnavailable(!persisted);
    setHasCustomLayout(hasChanges);
    bumpLayoutEpoch();
    return persisted;
  }, []);

  useEffect(() => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      // Storage can be unavailable in private browsing or hardened browsers.
    }

    storageRef.current = storage;
    const loaded = storage ? loadSignLayout(storage, signId) : null;
    const nextLayout = loaded ?? emptySignLayout(signId);
    const migratedPersisted = storage && loaded ? saveSignLayout(storage, loaded) : storage !== null;
    layoutRef.current = nextLayout;
    setPersistenceUnavailable(!migratedPersisted);
    setHasCustomLayout(hasStoredAnchors(nextLayout));
    setIsEditing(false);
    setSelectedObject(null);
    bumpLayoutEpoch();

    return () => {
      storageRef.current = null;
    };
  }, [signId]);

  const selectObject = useCallback((panelId: string, groupId: string | null) => {
    setSelectedObject((current) => {
      if (!groupId) return current ? null : current;
      return current?.panelId === panelId && current.groupId === groupId
        ? current
        : { panelId, groupId };
    });
  }, []);

  const getGroupLayout = useCallback(
    (panelId: string, revision: PanelLayoutRevision, groupId: string) => {
      const panel = layoutRef.current.panels[panelId];
      if (!panel || panel.revision !== revision) return null;
      return panel.groups[groupId] ?? null;
    },
    [],
  );

  const commitGroupLayout = useCallback(
    (
      panelId: string,
      revision: PanelLayoutRevision,
      groupId: string,
      groupLayout: StoredGroupLayout,
    ) => {
      const current = layoutRef.current;
      const panel = compatiblePanel(current, panelId, revision);
      return publishLayout(
        withPanel(current, panelId, {
          ...panel,
          groups: {
            ...panel.groups,
            [groupId]: normalizedGroupLayout(groupLayout),
          },
        }),
      );
    },
    [publishLayout],
  );

  const resetGroup = useCallback(
    (panelId: string, revision: PanelLayoutRevision, groupId: string) => {
      const current = layoutRef.current;
      const panel = current.panels[panelId];
      if (!panel || panel.revision !== revision || !panel.groups[groupId]) {
        return storageRef.current !== null;
      }

      const groups = { ...panel.groups };
      delete groups[groupId];
      return publishLayout(withoutEmptyPanel(current, panelId, { ...panel, groups }));
    },
    [publishLayout],
  );

  const getAddedElements = useCallback(
    (panelId: string, revision: PanelLayoutRevision) => {
      const panel = layoutRef.current.panels[panelId];
      return panel?.revision === revision ? panel.elements : EMPTY_ADDED_ELEMENTS;
    },
    [],
  );

  const addElement = useCallback(
    (
      panelId: string,
      revision: PanelLayoutRevision,
      content: AddedElementDraft,
    ) => {
      const current = layoutRef.current;
      const panel = compatiblePanel(current, panelId, revision);
      if (panel.elements.length >= MAX_ADDED_ELEMENTS) return null;

      const id = createElementId();
      const offset = (panel.elements.length % 5) * 0.025;
      const element = { ...content, id } as AddedCanvasElement;
      const groupId = addedElementGroupId(id);
      publishLayout(
        withPanel(current, panelId, {
          ...panel,
          groups: {
            ...panel.groups,
            [groupId]: {
              anchor: { x: 0.5 + offset, y: 0.5 + offset },
              scale: 1,
            },
          },
          elements: [...panel.elements, element],
        }),
      );
      return id;
    },
    [publishLayout],
  );

  const addTextElement = useCallback(
    (panelId: string, revision: PanelLayoutRevision, style: AddedTextStyle = "title") =>
      addElement(panelId, revision, {
        kind: "text",
        text: lang === "es" ? "NUEVO TEXTO" : "NEW TEXT",
        style,
      }),
    [addElement, lang],
  );

  const addIconElement = useCallback(
    (panelId: string, revision: PanelLayoutRevision, icon: InsertableIconKey) =>
      addElement(panelId, revision, { kind: "icon", icon }),
    [addElement],
  );

  const addImageElement = useCallback(
    (panelId: string, revision: PanelLayoutRevision, src: string, aspectRatio: number) =>
      addElement(panelId, revision, { kind: "image", src, aspectRatio }),
    [addElement],
  );

  const updateAddedElement = useCallback(
    (panelId: string, revision: PanelLayoutRevision, element: AddedCanvasElement) => {
      const current = layoutRef.current;
      const panel = current.panels[panelId];
      if (!panel || panel.revision !== revision) return false;
      const elementIndex = panel.elements.findIndex((candidate) => candidate.id === element.id);
      if (elementIndex < 0) return false;

      const normalizedElement: AddedCanvasElement =
        element.kind === "text"
          ? {
              ...element,
              text: element.text.slice(0, 120) || (lang === "es" ? "NUEVO TEXTO" : "NEW TEXT"),
            }
          : element;
      const elements = [...panel.elements];
      elements[elementIndex] = normalizedElement;
      return publishLayout(withPanel(current, panelId, { ...panel, elements }));
    },
    [lang, publishLayout],
  );

  const removeAddedElement = useCallback(
    (panelId: string, revision: PanelLayoutRevision, elementId: string) => {
      const current = layoutRef.current;
      const panel = current.panels[panelId];
      if (!panel || panel.revision !== revision) return false;
      const elements = panel.elements.filter((element) => element.id !== elementId);
      if (elements.length === panel.elements.length) return false;

      const groups = { ...panel.groups };
      delete groups[addedElementGroupId(elementId)];
      return publishLayout(withoutEmptyPanel(current, panelId, { ...panel, groups, elements }));
    },
    [publishLayout],
  );

  const duplicateAddedElement = useCallback(
    (panelId: string, revision: PanelLayoutRevision, elementId: string) => {
      const current = layoutRef.current;
      const panel = current.panels[panelId];
      if (!panel || panel.revision !== revision || panel.elements.length >= MAX_ADDED_ELEMENTS) {
        return null;
      }

      const source = panel.elements.find((element) => element.id === elementId);
      if (!source) return null;
      const id = createElementId();
      const duplicate = { ...source, id } as AddedCanvasElement;
      const sourceLayout = panel.groups[addedElementGroupId(elementId)] ?? {
        anchor: { x: 0.5, y: 0.5 },
        scale: 1,
      };
      publishLayout(
        withPanel(current, panelId, {
          ...panel,
          groups: {
            ...panel.groups,
            [addedElementGroupId(id)]: {
              anchor: {
                x: clamp(sourceLayout.anchor.x + 0.04, 0, 1),
                y: clamp(sourceLayout.anchor.y + 0.04, 0, 1),
              },
              scale: sourceLayout.scale,
            },
          },
          elements: [...panel.elements, duplicate],
        }),
      );
      return id;
    },
    [publishLayout],
  );

  const bringAddedElementToFront = useCallback(
    (panelId: string, revision: PanelLayoutRevision, elementId: string) => {
      const current = layoutRef.current;
      const panel = current.panels[panelId];
      if (!panel || panel.revision !== revision) return false;
      const index = panel.elements.findIndex((element) => element.id === elementId);
      if (index < 0 || index === panel.elements.length - 1) return false;

      const elements = [...panel.elements];
      const [element] = elements.splice(index, 1);
      elements.push(element);
      return publishLayout(withPanel(current, panelId, { ...panel, elements }));
    },
    [publishLayout],
  );

  const sendAddedElementToBack = useCallback(
    (panelId: string, revision: PanelLayoutRevision, elementId: string) => {
      const current = layoutRef.current;
      const panel = current.panels[panelId];
      if (!panel || panel.revision !== revision) return false;
      const index = panel.elements.findIndex((element) => element.id === elementId);
      if (index <= 0) return false;

      const elements = [...panel.elements];
      const [element] = elements.splice(index, 1);
      elements.unshift(element);
      return publishLayout(withPanel(current, panelId, { ...panel, elements }));
    },
    [publishLayout],
  );

  const getHiddenGroupCount = useCallback(
    (panelId: string, revision: PanelLayoutRevision) => {
      const panel = layoutRef.current.panels[panelId];
      if (!panel || panel.revision !== revision) return 0;
      return Object.values(panel.groups).filter((group) => group.hidden).length;
    },
    [],
  );

  const restoreHiddenGroups = useCallback(
    (panelId: string, revision: PanelLayoutRevision) => {
      const current = layoutRef.current;
      const panel = current.panels[panelId];
      if (!panel || panel.revision !== revision) return 0;
      let restored = 0;
      const groups = Object.fromEntries(
        Object.entries(panel.groups).map(([groupId, group]) => {
          if (!group.hidden) return [groupId, group];
          restored += 1;
          return [groupId, { anchor: group.anchor, scale: group.scale }];
        }),
      );
      if (restored > 0) publishLayout(withPanel(current, panelId, { ...panel, groups }));
      return restored;
    },
    [publishLayout],
  );

  const resetSign = useCallback(() => {
    setSelectedObject(null);
    const persisted = publishLayout(emptySignLayout(signId));
    announce(
      lang === "es"
        ? persisted
          ? `Se restableció el diseño original de ${resolvedSignLabel}.`
          : `Se restableció ${resolvedSignLabel} en esta sesión, pero el navegador no permitió guardar el cambio.`
        : persisted
          ? `The original design of ${resolvedSignLabel} was restored.`
          : `${resolvedSignLabel} was restored for this session, but the browser could not save the change.`,
    );
  }, [announce, lang, publishLayout, resolvedSignLabel, signId]);

  const toggleEditing = useCallback(() => {
    const nextEditing = !isEditing;
    setIsEditing(nextEditing);
    if (!nextEditing) setSelectedObject(null);
    announce(
      lang === "es"
        ? nextEditing
          ? `Edición activada para ${resolvedSignLabel}.`
          : `Edición finalizada para ${resolvedSignLabel}.`
        : nextEditing
          ? `Editing enabled for ${resolvedSignLabel}.`
          : `Editing finished for ${resolvedSignLabel}.`,
    );
  }, [announce, isEditing, lang, resolvedSignLabel]);

  const contextValue = useMemo<SignLayoutEditorContextValue>(
    () => ({
      signId,
      lang,
      isEditing,
      layoutEpoch,
      selectedObject,
      selectObject,
      getGroupLayout,
      commitGroupLayout,
      resetGroup,
      getAddedElements,
      addTextElement,
      addIconElement,
      addImageElement,
      updateAddedElement,
      removeAddedElement,
      duplicateAddedElement,
      bringAddedElementToFront,
      sendAddedElementToBack,
      getHiddenGroupCount,
      restoreHiddenGroups,
      announce,
    }),
    [
      addIconElement,
      addImageElement,
      addTextElement,
      announce,
      bringAddedElementToFront,
      commitGroupLayout,
      duplicateAddedElement,
      getAddedElements,
      getGroupLayout,
      getHiddenGroupCount,
      isEditing,
      lang,
      layoutEpoch,
      removeAddedElement,
      resetGroup,
      restoreHiddenGroups,
      selectObject,
      selectedObject,
      sendAddedElementToBack,
      signId,
      updateAddedElement,
    ],
  );

  return (
    <SignLayoutEditorContext.Provider value={contextValue}>
      <section
        data-sign-layout-editor
        data-sign-id={signId}
        aria-labelledby={headingId}
        className={className}
      >
        <div
          data-layout-toolbar
          className={`mb-4 flex flex-col gap-3 rounded-2xl border p-4 text-white shadow-lg shadow-black/20 print:hidden ${
            isEditing ? "border-[#F5C518]/70 bg-[#302b16]" : "border-[#00C4B0]/30 bg-[#102c2a]"
          }`}
          role="group"
          aria-label={
            lang === "es"
              ? `Herramientas de diseño para ${resolvedSignLabel}`
              : `Design tools for ${resolvedSignLabel}`
          }
        >
          <div className="min-w-0">
            <h4
              id={headingId}
              className={`text-sm font-black uppercase tracking-[0.14em] ${
                isEditing ? "text-[#ffe572]" : "text-[#9ff5eb]"
              }`}
            >
              {lang === "es" ? "Editor tipo Canva" : "Canvas-style editor"}
            </h4>
            <p className="mt-1 max-w-4xl text-xs leading-relaxed text-zinc-200 sm:text-sm">
              {isEditing
                ? lang === "es"
                  ? "Seleccione un objeto para moverlo, cambiar su tamaño o eliminarlo. Los textos e íconos agregados también se pueden editar y duplicar."
                  : "Select an object to move, resize, or delete it. Added text and icons can also be edited and duplicated."
                : lang === "es"
                  ? "Active el editor para personalizar los objetos. Los cambios se guardan en este navegador."
                  : "Enable the editor to customize objects. Changes are saved in this browser."}
              {persistenceUnavailable ? (
                <span className="mt-1 block font-bold text-[#ffe572]">
                  {lang === "es"
                    ? "El navegador no permitió guardar: los cambios durarán solo hasta recargar."
                    : "The browser did not allow saving; changes will last only until you reload."}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 min-[380px]:flex-row">
            <button
              type="button"
              onClick={toggleEditing}
              aria-pressed={isEditing}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isEditing
                  ? "border-[#F5C518] bg-[#F5C518] text-[#2E2A25] hover:bg-[#ffe572] focus-visible:outline-[#ffe572]"
                  : "border-[#00C4B0] bg-[#00C4B0] text-[#1f2927] hover:bg-[#35d7c6] focus-visible:outline-[#9ff5eb]"
              }`}
            >
              {isEditing ? (lang === "es" ? "Listo" : "Done") : lang === "es" ? "Editar objetos" : "Edit objects"}
            </button>
            <button
              type="button"
              onClick={resetSign}
              disabled={!hasCustomLayout}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 bg-white/10 px-4 text-sm font-black text-white transition hover:border-[#00C4B0]/70 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9ff5eb] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-zinc-500"
            >
              {lang === "es" ? "Restablecer rótulo" : "Reset sign"}
            </button>
          </div>
        </div>

        {children}

        <p
          key={announcement.sequence}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only print:hidden"
        >
          {announcement.message}
        </p>
      </section>
    </SignLayoutEditorContext.Provider>
  );
}
