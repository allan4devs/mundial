// ───────────────────────────────────────────────
// /plano — CAD-style gym floor planner + machine inventory
//
// World units are METERS. Screen units are pixels.
//   screen = world * pxPerM * zoom + offset
// Rectangles ("cuadros") store their TOP-LEFT corner (x, y).
// Machines store their CENTER (x, y) so rotation is natural.
// ───────────────────────────────────────────────

export type Tool = "select" | "pan" | "rect" | "machine";

export interface Vec2 {
  x: number;
  y: number;
}

/** Category buckets shared by the catalog and the zone palette. */
export type Category =
  | "cardio"
  | "strength"
  | "freeweights"
  | "functional"
  | "amenities";

export type MachineStatus = "ok" | "maintenance" | "down";

/** A drawn box: building outline, a training zone, a platform, a wall block… */
export interface PlanRect {
  id: string;
  kind: "rect";
  label: string;
  /** top-left corner, meters */
  x: number;
  y: number;
  /** size, meters */
  w: number;
  h: number;
  /** hex accent used for stroke + translucent fill */
  color: string;
  /** free-text zone tag, drives the inventory roll-ups */
  zone: string;
  notes?: string;
}

/** A placed piece of equipment tied to an inventory record. */
export interface PlanMachine {
  id: string;
  kind: "machine";
  /** key into MACHINE_CATALOG */
  catalogId: string;
  label: string;
  /** inventory / asset tag, user editable */
  assetTag: string;
  brand?: string;
  /** center position, meters */
  x: number;
  y: number;
  /** footprint, meters (seeded from the catalog, then editable) */
  w: number;
  h: number;
  /** degrees, clockwise, 0 = "front" faces up (−y) */
  rotation: number;
  status: MachineStatus;
  /** ISO yyyy-mm-dd of last service */
  lastService?: string;
  notes?: string;
}

export type PlanObject = PlanRect | PlanMachine;

export interface PlanDoc {
  version: 1;
  name: string;
  /** meters per grid cell */
  gridSize: number;
  /** base pixels per meter at zoom = 1 */
  pxPerM: number;
  objects: PlanObject[];
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  label: string;
  category: Category;
  /** default footprint width × depth, meters */
  w: number;
  h: number;
  /** short code used to build asset tags, e.g. "TRD" -> TRD-01 */
  code: string;
}
