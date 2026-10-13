"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentPropsWithoutRef,
  type PointerEvent as ReactPointerEvent,
  type Ref,
} from "react";
import { ImageUp, Plus, RotateCcw, Shapes, Type } from "lucide-react";
import AddedElementsLayer from "./AddedElementsLayer";
import {
  EditableSignCanvasContext,
  type EditableSignCanvasContextValue,
  type MovableGroupController,
} from "./canvasContext";
import { ImageUploadError, processImageFile } from "./imageUpload";
import {
  INSERTABLE_ICON_OPTIONS,
  localizeInsertableLabel,
} from "./insertableCatalog";
import { useSignLayoutEditor } from "./SignLayoutEditor";
import {
  addedElementGroupId,
  localize,
  type AddedCanvasElement,
  type AddedTextStyle,
  type InsertableIconKey,
  type LocalizedText,
  type PanelLayoutRevision,
  type StoredGroupLayout,
} from "./types";

export type EditableSignCanvasProps = ComponentPropsWithoutRef<"div"> & {
  panelId: string;
  revision: PanelLayoutRevision;
  label: LocalizedText;
  /** Acceso directo al nodo del lienzo, por ejemplo para exportarlo a imagen. */
  ref?: Ref<HTMLDivElement>;
};

export default function EditableSignCanvas({
  panelId,
  revision,
  label,
  children,
  role = "group",
  "aria-label": ariaLabel,
  onPointerDownCapture,
  ref,
  ...divProps
}: EditableSignCanvasProps) {
  const editor = useSignLayoutEditor();
  const canvasRef = useRef<HTMLDivElement>(null);
  const setCanvasNode = useCallback(
    (node: HTMLDivElement | null) => {
      canvasRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const groupsRef = useRef(new Map<string, MovableGroupController>());
  const resizeFrameRef = useRef<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [selectedIcon, setSelectedIcon] = useState<InsertableIconKey>("arrow-right");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const resolvedLabel = localize(label, editor.lang);
  const addedElements = editor.getAddedElements(panelId, revision);
  const hiddenGroupCount = editor.getHiddenGroupCount(panelId, revision);
  const selectedGroupId =
    editor.selectedObject?.panelId === panelId ? editor.selectedObject.groupId : null;

  const selectGroup = useCallback(
    (groupId: string | null) => editor.selectObject(panelId, groupId),
    [editor.selectObject, panelId],
  );

  const getSavedLayout = useCallback(
    (groupId: string) => editor.getGroupLayout(panelId, revision, groupId),
    [editor.getGroupLayout, panelId, revision],
  );

  const commitLayout = useCallback(
    (groupId: string, groupLayout: StoredGroupLayout) =>
      editor.commitGroupLayout(panelId, revision, groupId, groupLayout),
    [editor.commitGroupLayout, panelId, revision],
  );

  const resetGroup = useCallback(
    (groupId: string) => editor.resetGroup(panelId, revision, groupId),
    [editor.resetGroup, panelId, revision],
  );

  const registerGroup = useCallback((groupId: string, controller: MovableGroupController) => {
    groupsRef.current.set(groupId, controller);
    return () => {
      if (groupsRef.current.get(groupId) === controller) groupsRef.current.delete(groupId);
    };
  }, []);

  const reapplyAllLayouts = useCallback(() => {
    for (const controller of groupsRef.current.values()) controller.reapplyLayout();
  }, []);

  const requestLayoutReapply = useCallback(() => {
    if (resizeFrameRef.current !== null) return;

    resizeFrameRef.current = requestAnimationFrame(() => {
      resizeFrameRef.current = null;
      reapplyAllLayouts();
    });
  }, [reapplyAllLayouts]);

  useEffect(() => {
    requestLayoutReapply();
  }, [editor.layoutEpoch, requestLayoutReapply]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(requestLayoutReapply);
    observer.observe(canvas);

    return () => {
      observer.disconnect();
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, [requestLayoutReapply]);

  useEffect(() => {
    const printMedia = window.matchMedia("print");
    const handleBeforePrint = () => reapplyAllLayouts();
    const handleAfterPrint = () => requestLayoutReapply();
    const handlePrintMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) reapplyAllLayouts();
      else requestLayoutReapply();
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);
    printMedia.addEventListener("change", handlePrintMediaChange);
    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
      printMedia.removeEventListener("change", handlePrintMediaChange);
    };
  }, [reapplyAllLayouts, requestLayoutReapply]);

  const addTextElement = useCallback(
    (style: AddedTextStyle = "title") => {
      const id = editor.addTextElement(panelId, revision, style);
      if (!id) {
        editor.announce(
          editor.lang === "es"
            ? "Esta lámina alcanzó el máximo de objetos agregados."
            : "This panel reached the maximum number of added objects.",
        );
        return null;
      }
      const groupId = addedElementGroupId(id);
      selectGroup(groupId);
      editor.announce(editor.lang === "es" ? "Texto agregado." : "Text added.");
      return id;
    },
    [editor.addTextElement, editor.announce, editor.lang, panelId, revision, selectGroup],
  );

  const addIconElement = useCallback(
    (icon: InsertableIconKey) => {
      const id = editor.addIconElement(panelId, revision, icon);
      if (!id) {
        editor.announce(
          editor.lang === "es"
            ? "Esta lámina alcanzó el máximo de objetos agregados."
            : "This panel reached the maximum number of added objects.",
        );
        return null;
      }
      const groupId = addedElementGroupId(id);
      selectGroup(groupId);
      editor.announce(editor.lang === "es" ? "Ícono agregado." : "Icon added.");
      return id;
    },
    [editor.addIconElement, editor.announce, editor.lang, panelId, revision, selectGroup],
  );

  const addImageElement = useCallback(
    (src: string, aspectRatio: number) => {
      const id = editor.addImageElement(panelId, revision, src, aspectRatio);
      if (!id) {
        editor.announce(
          editor.lang === "es"
            ? "Esta lámina alcanzó el máximo de objetos agregados."
            : "This panel reached the maximum number of added objects.",
        );
        return null;
      }
      const groupId = addedElementGroupId(id);
      selectGroup(groupId);
      editor.announce(editor.lang === "es" ? "Imagen agregada." : "Image added.");
      return id;
    },
    [editor.addImageElement, editor.announce, editor.lang, panelId, revision, selectGroup],
  );

  const imageUploadErrorMessage = useCallback(
    (reason: ImageUploadError["reason"]) => {
      if (editor.lang === "es") {
        switch (reason) {
          case "unsupported-type":
            return "Formato no admitido. Use PNG, JPG, WEBP o GIF.";
          case "too-large":
            return "La imagen es demasiado pesada (máximo 20 MB).";
          default:
            return "No se pudo procesar la imagen.";
        }
      }
      switch (reason) {
        case "unsupported-type":
          return "Unsupported format. Use PNG, JPG, WEBP, or GIF.";
        case "too-large":
          return "The image is too large (20 MB maximum).";
        default:
          return "The image could not be processed.";
      }
    },
    [editor.lang],
  );

  const handleImageFile = useCallback(
    async (file: File) => {
      setIsUploadingImage(true);
      try {
        const { src, aspectRatio } = await processImageFile(file);
        addImageElement(src, aspectRatio);
      } catch (error) {
        const reason = error instanceof ImageUploadError ? error.reason : "decode-failed";
        editor.announce(imageUploadErrorMessage(reason));
      } finally {
        setIsUploadingImage(false);
      }
    },
    [addImageElement, editor, imageUploadErrorMessage],
  );

  const handleImageInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = "";
      if (file) void handleImageFile(file);
    },
    [handleImageFile],
  );

  const updateAddedElement = useCallback(
    (element: AddedCanvasElement) => editor.updateAddedElement(panelId, revision, element),
    [editor.updateAddedElement, panelId, revision],
  );

  const removeAddedElement = useCallback(
    (elementId: string) => editor.removeAddedElement(panelId, revision, elementId),
    [editor.removeAddedElement, panelId, revision],
  );

  const duplicateAddedElement = useCallback(
    (elementId: string) => editor.duplicateAddedElement(panelId, revision, elementId),
    [editor.duplicateAddedElement, panelId, revision],
  );

  const bringAddedElementToFront = useCallback(
    (elementId: string) => editor.bringAddedElementToFront(panelId, revision, elementId),
    [editor.bringAddedElementToFront, panelId, revision],
  );

  const sendAddedElementToBack = useCallback(
    (elementId: string) => editor.sendAddedElementToBack(panelId, revision, elementId),
    [editor.sendAddedElementToBack, panelId, revision],
  );

  const restoreHiddenGroups = useCallback(() => {
    const count = editor.restoreHiddenGroups(panelId, revision);
    if (count > 0) {
      editor.announce(
        editor.lang === "es"
          ? `${count} objeto${count === 1 ? "" : "s"} restaurado${count === 1 ? "" : "s"}.`
          : `${count} object${count === 1 ? "" : "s"} restored.`,
      );
    }
    return count;
  }, [editor.announce, editor.lang, editor.restoreHiddenGroups, panelId, revision]);

  const contextValue = useMemo<EditableSignCanvasContextValue>(
    () => ({
      panelId,
      revision,
      lang: editor.lang,
      isEditing: editor.isEditing,
      canvasRef,
      selectedGroupId,
      selectGroup,
      getSavedLayout,
      commitLayout,
      resetGroup,
      registerGroup,
      addedElements,
      addTextElement,
      addIconElement,
      addImageElement,
      updateAddedElement,
      removeAddedElement,
      duplicateAddedElement,
      bringAddedElementToFront,
      sendAddedElementToBack,
      hiddenGroupCount,
      restoreHiddenGroups,
      announce: editor.announce,
    }),
    [
      addIconElement,
      addImageElement,
      addTextElement,
      addedElements,
      bringAddedElementToFront,
      commitLayout,
      duplicateAddedElement,
      editor.announce,
      editor.isEditing,
      editor.lang,
      getSavedLayout,
      hiddenGroupCount,
      panelId,
      registerGroup,
      removeAddedElement,
      resetGroup,
      restoreHiddenGroups,
      revision,
      selectGroup,
      selectedGroupId,
      sendAddedElementToBack,
      updateAddedElement,
    ],
  );

  const handlePointerDownCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDownCapture?.(event);
    if (!editor.isEditing) return;

    const target = event.target as Element;
    if (target.closest("[data-layout-canvas-tools]")) return;
    if (target.closest("[data-layout-object-overlay]")) return;
    const movable = target.closest<HTMLElement>("[data-layout-movable]");
    selectGroup(movable?.dataset.layoutGroupId ?? null);
  };

  return (
    <EditableSignCanvasContext.Provider value={contextValue}>
      <>
        <div
          {...divProps}
          ref={setCanvasNode}
          role={role}
          aria-label={ariaLabel ?? resolvedLabel}
          data-layout-canvas
          data-layout-editing={editor.isEditing ? "true" : "false"}
          data-layout-panel-id={panelId}
          data-layout-panel-revision={String(revision)}
          onPointerDownCapture={handlePointerDownCapture}
        >
          {children}
          <AddedElementsLayer />
        </div>

        {editor.isEditing ? (
          <div
            data-layout-canvas-tools
            data-layout-panel-tools={panelId}
            role="group"
            aria-label={
              editor.lang === "es"
                ? `Agregar objetos a ${resolvedLabel}`
                : `Add objects to ${resolvedLabel}`
            }
            className="relative z-[70] mx-auto mt-3 flex w-fit max-w-full flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-white/25 bg-[#2E2A25]/95 p-2 text-white shadow-2xl backdrop-blur-md print:hidden"
          >
            <button
              type="button"
              onClick={() => addTextElement("title")}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#00C4B0] px-3 text-xs font-black text-[#17332F] hover:bg-[#35d7c6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Type className="h-4 w-4" aria-hidden />
              {editor.lang === "es" ? "Texto" : "Text"}
            </button>
            <label className="sr-only" htmlFor={`${panelId}-insert-icon`}>
              {editor.lang === "es" ? "Tipo de ícono" : "Icon type"}
            </label>
            <select
              id={`${panelId}-insert-icon`}
              value={selectedIcon}
              onChange={(event) => setSelectedIcon(event.target.value as InsertableIconKey)}
              className="min-h-11 max-w-44 rounded-xl border border-white/25 bg-zinc-950 px-2 text-xs font-bold text-white outline-none focus:border-[#00C4B0]"
            >
              {INSERTABLE_ICON_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {localizeInsertableLabel(option.label, editor.lang)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => addIconElement(selectedIcon)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#00C4B0]/55 bg-[#00C4B0]/15 px-3 text-xs font-black text-[#A8F0E8] hover:bg-[#00C4B0]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <Shapes className="h-4 w-4" aria-hidden />
              {editor.lang === "es" ? "Ícono" : "Icon"}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleImageInputChange}
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploadingImage}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#00C4B0]/55 bg-[#00C4B0]/15 px-3 text-xs font-black text-[#A8F0E8] hover:bg-[#00C4B0]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60"
            >
              <ImageUp className="h-4 w-4" aria-hidden />
              {isUploadingImage
                ? editor.lang === "es"
                  ? "Cargando…"
                  : "Uploading…"
                : editor.lang === "es"
                  ? "Imagen"
                  : "Image"}
            </button>
            {hiddenGroupCount > 0 ? (
              <button
                type="button"
                onClick={restoreHiddenGroups}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#F5C518]/55 bg-[#F5C518]/15 px-3 text-xs font-black text-[#ffe572] hover:bg-[#F5C518]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <RotateCcw className="h-4 w-4" aria-hidden />
                {editor.lang === "es" ? `Restaurar (${hiddenGroupCount})` : `Restore (${hiddenGroupCount})`}
              </button>
            ) : null}
          </div>
        ) : null}
      </>
    </EditableSignCanvasContext.Provider>
  );
}
