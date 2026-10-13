import type {
  AddedCanvasElement,
  AddedTextStyle,
  InsertableIconKey,
  NormalizedCenterAnchor,
  PanelLayoutRevision,
  StoredGroupLayout,
  StoredPanelLayout,
  StoredSignLayout,
  StoredTextFormat,
  TextFontFamily,
} from "./types";
import { INSERTABLE_ICON_KEYS } from "./types";

export const LAYOUT_STORAGE_VERSION = 2 as const;

const STORAGE_NAMESPACE = "la-vieja:rotulos-layout";
const LEGACY_STORAGE_VERSION = 1 as const;
const MAX_ID_LENGTH = 48;
const MAX_TEXT_LENGTH = 120;
const MAX_PANELS = 48;
const MAX_GROUPS_PER_PANEL = 96;
const MAX_ELEMENTS_PER_PANEL = 48;
const MIN_SCALE = 0.2;
const MAX_SCALE = 4;
/** ~2.9MB de datos binarios en base64; imageUpload.ts ya comprime antes de llegar aquí. */
const MAX_IMAGE_SRC_LENGTH = 4_000_000;
const IMAGE_DATA_URL_PATTERN =
  /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/;

const ADDED_TEXT_STYLES = new Set<AddedTextStyle>([
  "title",
  "subtitle",
  "label",
  "cta",
]);
const INSERTABLE_ICON_KEY_SET = new Set<InsertableIconKey>(INSERTABLE_ICON_KEYS);
const TEXT_FONT_FAMILIES = new Set<TextFontFamily>(["display", "sans", "mono"]);

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem" | "removeItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  const allowed = new Set(allowedKeys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function isStableId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_ID_LENGTH &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  );
}

function isRevision(value: unknown): value is PanelLayoutRevision {
  return (
    (typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH) ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

function validatedAnchor(value: unknown): NormalizedCenterAnchor | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["x", "y"])) return null;

  const { x, y } = value;
  if (
    typeof x !== "number" ||
    !Number.isFinite(x) ||
    x < 0 ||
    x > 1 ||
    typeof y !== "number" ||
    !Number.isFinite(y) ||
    y < 0 ||
    y > 1
  ) {
    return null;
  }

  return { x, y };
}

function validatedScale(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= MIN_SCALE &&
    value <= MAX_SCALE
    ? value
    : null;
}

function validatedTextFormat(value: unknown): StoredTextFormat | null | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value) || !hasOnlyKeys(value, ["content", "bold", "italic", "underline", "fontFamily"])) {
    return null;
  }

  const { content, bold, italic, underline, fontFamily } = value;
  if (content !== undefined && (typeof content !== "string" || content.length > MAX_TEXT_LENGTH)) {
    return null;
  }
  if (bold !== undefined && typeof bold !== "boolean") return null;
  if (italic !== undefined && typeof italic !== "boolean") return null;
  if (underline !== undefined && typeof underline !== "boolean") return null;
  if (fontFamily !== undefined && (typeof fontFamily !== "string" || !TEXT_FONT_FAMILIES.has(fontFamily as TextFontFamily))) {
    return null;
  }

  return {
    ...(content === undefined ? {} : { content }),
    ...(bold === undefined ? {} : { bold }),
    ...(italic === undefined ? {} : { italic }),
    ...(underline === undefined ? {} : { underline }),
    ...(fontFamily === undefined ? {} : { fontFamily: fontFamily as TextFontFamily }),
  };
}

function validatedGroups(
  value: unknown,
  options: { legacy?: boolean } = {},
): Record<string, StoredGroupLayout> | null {
  if (!isRecord(value)) return null;

  const entries = Object.entries(value);
  if (entries.length > MAX_GROUPS_PER_PANEL) return null;

  const groups: Record<string, StoredGroupLayout> = {};
  for (const [groupId, candidate] of entries) {
    if (!isStableId(groupId) || !isRecord(candidate)) return null;

    const allowedKeys = options.legacy ? ["anchor"] : ["anchor", "scale", "hidden", "text"];
    if (!hasOnlyKeys(candidate, allowedKeys)) return null;

    const anchor = validatedAnchor(candidate.anchor);
    if (!anchor) return null;

    if (options.legacy) {
      groups[groupId] = { anchor, scale: 1 };
      continue;
    }

    const scale = validatedScale(candidate.scale);
    if (scale === null || (candidate.hidden !== undefined && typeof candidate.hidden !== "boolean")) {
      return null;
    }

    const text = validatedTextFormat(candidate.text);
    if (text === null) return null;

    groups[groupId] = {
      anchor,
      scale,
      ...(candidate.hidden === undefined ? {} : { hidden: candidate.hidden }),
      ...(text === undefined ? {} : { text }),
    };
  }

  return groups;
}

function validatedTextElement(value: Record<string, unknown>): AddedCanvasElement | null {
  if (!hasOnlyKeys(value, ["id", "kind", "text", "style"]) || !isStableId(value.id)) {
    return null;
  }

  if (
    value.kind !== "text" ||
    typeof value.text !== "string" ||
    value.text.length === 0 ||
    value.text.length > MAX_TEXT_LENGTH ||
    typeof value.style !== "string" ||
    !ADDED_TEXT_STYLES.has(value.style as AddedTextStyle)
  ) {
    return null;
  }

  return {
    id: value.id,
    kind: "text",
    text: value.text,
    style: value.style as AddedTextStyle,
  };
}

function validatedIconElement(value: Record<string, unknown>): AddedCanvasElement | null {
  if (!hasOnlyKeys(value, ["id", "kind", "icon"]) || !isStableId(value.id)) return null;

  if (
    value.kind !== "icon" ||
    typeof value.icon !== "string" ||
    !INSERTABLE_ICON_KEY_SET.has(value.icon as InsertableIconKey)
  ) {
    return null;
  }

  return {
    id: value.id,
    kind: "icon",
    icon: value.icon as InsertableIconKey,
  };
}

function isValidImageDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_IMAGE_SRC_LENGTH &&
    IMAGE_DATA_URL_PATTERN.test(value)
  );
}

function validatedImageElement(value: Record<string, unknown>): AddedCanvasElement | null {
  if (!hasOnlyKeys(value, ["id", "kind", "src", "aspectRatio"]) || !isStableId(value.id)) {
    return null;
  }

  if (
    value.kind !== "image" ||
    !isValidImageDataUrl(value.src) ||
    typeof value.aspectRatio !== "number" ||
    !Number.isFinite(value.aspectRatio) ||
    value.aspectRatio <= 0
  ) {
    return null;
  }

  return {
    id: value.id,
    kind: "image",
    src: value.src,
    aspectRatio: value.aspectRatio,
  };
}

function validatedElements(value: unknown): AddedCanvasElement[] | null {
  if (!Array.isArray(value) || value.length > MAX_ELEMENTS_PER_PANEL) return null;

  const ids = new Set<string>();
  const elements: AddedCanvasElement[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate) || typeof candidate.kind !== "string") return null;

    const element =
      candidate.kind === "text"
        ? validatedTextElement(candidate)
        : candidate.kind === "icon"
          ? validatedIconElement(candidate)
          : candidate.kind === "image"
            ? validatedImageElement(candidate)
            : null;
    if (!element || ids.has(element.id)) return null;

    ids.add(element.id);
    elements.push(element);
  }

  return elements;
}

function validatedPanel(
  value: unknown,
  options: { legacy?: boolean } = {},
): StoredPanelLayout | null {
  if (!isRecord(value) || !isRevision(value.revision)) return null;

  const allowedKeys = options.legacy ? ["revision", "groups"] : ["revision", "groups", "elements"];
  if (!hasOnlyKeys(value, allowedKeys)) return null;

  const groups = validatedGroups(value.groups, options);
  if (!groups) return null;

  const elements = options.legacy ? [] : validatedElements(value.elements);
  if (!elements) return null;

  return { revision: value.revision, groups, elements };
}

/** Pure parser: malformed, stale or cross-sign data is never exposed to React. */
export function parseStoredSignLayout(raw: string, expectedSignId: string): StoredSignLayout | null {
  if (!isStableId(expectedSignId)) return null;

  try {
    const candidate: unknown = JSON.parse(raw);
    if (
      !isRecord(candidate) ||
      candidate.version !== LAYOUT_STORAGE_VERSION ||
      candidate.signId !== expectedSignId ||
      !isRecord(candidate.panels) ||
      !hasOnlyKeys(candidate, ["version", "signId", "panels"])
    ) {
      return null;
    }

    const entries = Object.entries(candidate.panels);
    if (entries.length > MAX_PANELS) return null;

    const panels: Record<string, StoredPanelLayout> = {};
    for (const [panelId, panelCandidate] of entries) {
      if (!isStableId(panelId)) return null;
      const panel = validatedPanel(panelCandidate);
      if (!panel) return null;
      panels[panelId] = panel;
    }

    return {
      version: LAYOUT_STORAGE_VERSION,
      signId: expectedSignId,
      panels,
    };
  } catch {
    return null;
  }
}

function parseLegacySignLayout(raw: string, expectedSignId: string): StoredSignLayout | null {
  if (!isStableId(expectedSignId)) return null;

  try {
    const candidate: unknown = JSON.parse(raw);
    if (
      !isRecord(candidate) ||
      candidate.version !== LEGACY_STORAGE_VERSION ||
      candidate.signId !== expectedSignId ||
      !isRecord(candidate.panels) ||
      !hasOnlyKeys(candidate, ["version", "signId", "panels"])
    ) {
      return null;
    }

    const entries = Object.entries(candidate.panels);
    if (entries.length > MAX_PANELS) return null;

    const panels: Record<string, StoredPanelLayout> = {};
    for (const [panelId, panelCandidate] of entries) {
      if (!isStableId(panelId)) return null;
      const panel = validatedPanel(panelCandidate, { legacy: true });
      if (!panel) return null;
      panels[panelId] = panel;
    }

    return {
      version: LAYOUT_STORAGE_VERSION,
      signId: expectedSignId,
      panels,
    };
  } catch {
    return null;
  }
}

export function signLayoutStorageKey(signId: string): string {
  return `${STORAGE_NAMESPACE}:v${LAYOUT_STORAGE_VERSION}:${encodeURIComponent(signId)}`;
}

function legacySignLayoutStorageKey(signId: string): string {
  return `${STORAGE_NAMESPACE}:v${LEGACY_STORAGE_VERSION}:${encodeURIComponent(signId)}`;
}

export function emptySignLayout(signId: string): StoredSignLayout {
  return {
    version: LAYOUT_STORAGE_VERSION,
    signId,
    panels: {},
  };
}

/** Call this from a client effect; the helper itself has no browser globals. */
export function loadSignLayout(storage: ReadableStorage, signId: string): StoredSignLayout | null {
  try {
    const raw = storage.getItem(signLayoutStorageKey(signId));
    if (raw) {
      const parsed = parseStoredSignLayout(raw, signId);
      if (parsed) return parsed;
    }

    const legacyRaw = storage.getItem(legacySignLayoutStorageKey(signId));
    return legacyRaw ? parseLegacySignLayout(legacyRaw, signId) : null;
  } catch {
    return null;
  }
}

export function saveSignLayout(storage: WritableStorage, layout: StoredSignLayout): boolean {
  try {
    const serialized = JSON.stringify(layout);
    const validated = parseStoredSignLayout(serialized, layout.signId);
    if (!validated) return false;

    storage.setItem(signLayoutStorageKey(validated.signId), JSON.stringify(validated));
    try {
      storage.removeItem(legacySignLayoutStorageKey(validated.signId));
    } catch {
      // La versión nueva ya quedó guardada; un key legado inaccesible no la invalida.
    }
    return true;
  } catch {
    return false;
  }
}

export function removeSignLayout(storage: WritableStorage, signId: string): boolean {
  let currentRemoved = false;
  let legacyRemoved = false;

  try {
    storage.removeItem(signLayoutStorageKey(signId));
    currentRemoved = true;
  } catch {
    currentRemoved = false;
  }

  try {
    storage.removeItem(legacySignLayoutStorageKey(signId));
    legacyRemoved = true;
  } catch {
    legacyRemoved = false;
  }

  return currentRemoved && legacyRemoved;
}

export function hasStoredAnchors(layout: StoredSignLayout): boolean {
  return Object.values(layout.panels).some(
    (panel) => Object.keys(panel.groups).length > 0 || panel.elements.length > 0,
  );
}
