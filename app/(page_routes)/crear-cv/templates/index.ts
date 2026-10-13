import type { ComponentType } from "react";
import type { TemplateId, TemplateProps } from "../types";
import { Clasico } from "./Clasico";
import { Minimal } from "./Minimal";
import { Moderno } from "./Moderno";
import { Ejecutivo } from "./Ejecutivo";
import { Compacto } from "./Compacto";

export const TEMPLATES: Record<TemplateId, ComponentType<TemplateProps>> = {
  clasico: Clasico,
  minimal: Minimal,
  moderno: Moderno,
  ejecutivo: Ejecutivo,
  compacto: Compacto,
};

export const FREE_TEMPLATES: TemplateId[] = ["clasico", "minimal"];
export const TEMPLATE_ORDER: TemplateId[] = [
  "clasico",
  "minimal",
  "moderno",
  "ejecutivo",
  "compacto",
];

export const isFreeTemplate = (id: TemplateId): boolean => FREE_TEMPLATES.includes(id);
