// ─────────────────────────────────────────────────────────────
// Oscar Steve Vindas Campos — CV en español (Cocinero / Gastronomía).
//
// Persona distinta a las demás variantes (que son de Allan), por eso NO usa las
// definiciones compartidas (identity / education): define su propia identidad,
// formación y experiencia. `labels` traduce los encabezados de sección al
// español (los demás CV se quedan en inglés por defecto). Contacto: teléfono y
// correo quedan como marcador — se completan en el editor de /cv.
// ─────────────────────────────────────────────────────────────

import { Mail, MapPin, Phone } from "lucide-react";
import type { ContactEntry, CvData, CvLabels, SummarySegment } from "../types";

export const labels: Partial<CvLabels> = {
  coreSkills: "Habilidades",
  education: "Formación",
  languages: "Idiomas",
  summary: "Perfil",
  experience: "Experiencia Laboral",
  documentType: "Currículum",
};

export const personalInfo = {
  name: "Oscar Steve Vindas Campos",
  title: "Cocinero · Gastronomía",
};

export const contactInfo: ContactEntry[] = [
  { icon: MapPin, text: "San Carlos, Alajuela · Costa Rica" },
  { icon: Phone, text: "Teléfono por completar" },
  { icon: Mail, text: "Correo por completar" },
];

export const primarySkills = [
  {
    label: "Cocina y servicio",
    items: ["Preparación y cocción", "Mise en place", "Emplatado", "Apoyo en línea"],
  },
  {
    label: "Operación e higiene",
    items: ["Manipulación de alimentos", "Limpieza y orden", "Rotación de producto", "Atención al cliente"],
  },
] as const;

export const secondarySkills = [
  {
    label: "Fortalezas",
    items: ["Trabajo en equipo", "Responsabilidad", "Puntualidad", "Adaptación al ritmo del servicio"],
  },
];

export const education = {
  degree: "Educación Secundaria (9.° año)",
  school: "Liceo San Carlos",
  period: "San Carlos, Costa Rica",
  internshipLabel: "INA:",
  internship: "Tecnologías de la Información y la Comunicación · Ago 2024 – Dic 2025",
} satisfies CvData["education"];

export const languages = [
  { language: "Español", level: "Nativo" },
  { language: "Inglés", level: "Básico" },
] as const;

export const summary: SummarySegment[][] = [
  [
    { text: "Cocinero con experiencia reciente en hotelería, " },
    { text: "preparación de alimentos y apoyo durante el servicio", bold: true, accent: true },
    { text: ". Cuenta con certificado de Manipulación de Alimentos y formación técnica del INA. Se distingue por su responsabilidad, orden y disposición para colaborar con el equipo de cocina." },
  ],
];

export const experience: {
  role: string;
  company: string;
  period: string;
  location: string;
  current?: boolean;
  bullets: string[];
}[] = [
  {
    role: "Cocinero",
    company: "Hotel Río Guanacaste",
    period: "Ene – Set 2026",
    location: "Guanacaste, Costa Rica",
    bullets: [
      "Preparación y cocción de alimentos para el servicio diario del hotel.",
      "Alistado de ingredientes, porcionado y preparación de estaciones antes del servicio.",
      "Limpieza del área y manipulación higiénica de los alimentos.",
    ],
  },
  {
    role: "Gondolero",
    company: "Supermercado El Parque",
    period: "Mar – Set 2024",
    location: "San Carlos, Costa Rica",
    bullets: [
      "Acomodo y reposición de mercadería, con control de fechas y rotación de producto.",
      "Mantenimiento del orden en góndolas y atención a clientes en sala.",
    ],
  },
];
