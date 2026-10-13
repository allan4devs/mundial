"use client";

import { createContext, useContext, type RefObject } from "react";
import type {
  AddedCanvasElement,
  AddedTextStyle,
  InsertableIconKey,
  Lang,
  PanelLayoutRevision,
  StoredGroupLayout,
} from "./types";

export type MovableGroupController = {
  reapplyLayout: () => void;
};

export type EditableSignCanvasContextValue = {
  panelId: string;
  revision: PanelLayoutRevision;
  lang: Lang;
  isEditing: boolean;
  canvasRef: RefObject<HTMLDivElement | null>;
  selectedGroupId: string | null;
  selectGroup: (groupId: string | null) => void;
  getSavedLayout: (groupId: string) => StoredGroupLayout | null;
  commitLayout: (groupId: string, groupLayout: StoredGroupLayout) => boolean;
  resetGroup: (groupId: string) => boolean;
  registerGroup: (groupId: string, controller: MovableGroupController) => () => void;
  addedElements: readonly AddedCanvasElement[];
  addTextElement: (style?: AddedTextStyle) => string | null;
  addIconElement: (icon: InsertableIconKey) => string | null;
  addImageElement: (src: string, aspectRatio: number) => string | null;
  updateAddedElement: (element: AddedCanvasElement) => boolean;
  removeAddedElement: (elementId: string) => boolean;
  duplicateAddedElement: (elementId: string) => string | null;
  bringAddedElementToFront: (elementId: string) => boolean;
  sendAddedElementToBack: (elementId: string) => boolean;
  hiddenGroupCount: number;
  restoreHiddenGroups: () => number;
  announce: (message: string) => void;
};

export const EditableSignCanvasContext =
  createContext<EditableSignCanvasContextValue | null>(null);

export function useEditableSignCanvas(): EditableSignCanvasContextValue {
  const value = useContext(EditableSignCanvasContext);
  if (!value) {
    throw new Error("MovableGroup must be rendered inside EditableSignCanvas.");
  }
  return value;
}
