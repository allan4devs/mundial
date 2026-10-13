// Starter content: a blank résumé and a realistic Costa Rica example so the
// live preview is never empty on first load.

import type { BuilderState, CvLang, ResumeData } from "./types";

export const uid = (p = "id"): string =>
  p +
  "_" +
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10));

export const ACCENTS = [
  "#0d9488", // teal
  "#2563eb", // blue
  "#7c3aed", // violet
  "#db2777", // pink
  "#ea580c", // orange
  "#059669", // emerald
  "#0f172a", // slate (mono)
  "#b91c1c", // red
];

export function emptyResume(): ResumeData {
  return {
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    links: [],
    summary: "",
    experience: [
      {
        id: uid("exp"),
        role: "",
        company: "",
        location: "",
        start: "",
        end: "",
        current: false,
        bullets: [""],
      },
    ],
    education: [
      {
        id: uid("edu"),
        degree: "",
        school: "",
        location: "",
        start: "",
        end: "",
        note: "",
      },
    ],
    skills: [{ id: uid("sk"), label: "", items: [] }],
    languages: [
      { id: uid("lng"), name: "Español", level: "Nativo" },
      { id: uid("lng"), name: "Inglés", level: "Intermedio" },
    ],
    projects: [],
    references: "",
  };
}

export function sampleResume(lang: CvLang = "es"): ResumeData {
  if (lang === "en") {
    return {
      fullName: "María Fernanda Solís Vargas",
      headline: "Administrative Assistant",
      email: "mariafernanda.solis@gmail.com",
      phone: "+506 8712 4590",
      location: "San José, Costa Rica",
      website: "",
      links: [
        { id: uid("ln"), label: "LinkedIn", url: "linkedin.com/in/mfsolis" },
      ],
      summary:
        "Administrative assistant with 5+ years supporting operations and finance teams in Costa Rica. Organized, bilingual, and comfortable owning calendars, purchasing, and client communication.\n\nKnown for turning messy processes into clear checklists and for keeping suppliers, payments, and reports on schedule.",
      experience: [
        {
          id: uid("exp"),
          role: "Administrative Assistant",
          company: "Grupo Comercial del Valle",
          location: "San José",
          start: "Feb 2022",
          end: "",
          current: true,
          bullets: [
            "Manage the calendar and travel for a 12-person commercial team, cutting scheduling conflicts to near zero.",
            "Process 60+ purchase orders per month and reconcile them against supplier invoices in QuickBooks.",
            "Coordinate onboarding logistics for new hires: equipment, access, and first-week schedule.",
          ],
        },
        {
          id: uid("exp"),
          role: "Receptionist / Office Support",
          company: "Clínica Dental Sonríe",
          location: "Heredia",
          start: "Jan 2019",
          end: "Feb 2022",
          current: false,
          bullets: [
            "Handled 40+ daily calls and the appointment book for four dentists.",
            "Kept patient records and insurance paperwork accurate and up to date.",
          ],
        },
      ],
      education: [
        {
          id: uid("edu"),
          degree: "Diploma in Business Administration",
          school: "Universidad Técnica Nacional (UTN)",
          location: "Alajuela",
          start: "2016",
          end: "2018",
          note: "",
        },
      ],
      skills: [
        { id: uid("sk"), label: "Tools", items: ["Excel", "QuickBooks", "Google Workspace", "Slack"] },
        { id: uid("sk"), label: "Strengths", items: ["Scheduling", "Purchasing", "Customer service", "Reporting"] },
      ],
      languages: [
        { id: uid("lng"), name: "Spanish", level: "Native" },
        { id: uid("lng"), name: "English", level: "B2 · Upper-intermediate" },
      ],
      projects: [],
      references: "Available on request",
    };
  }

  return {
    fullName: "María Fernanda Solís Vargas",
    headline: "Asistente Administrativa",
    email: "mariafernanda.solis@gmail.com",
    phone: "+506 8712 4590",
    location: "San José, Costa Rica",
    website: "",
    links: [{ id: uid("ln"), label: "LinkedIn", url: "linkedin.com/in/mfsolis" }],
    summary:
      "Asistente administrativa con más de 5 años apoyando equipos de operaciones y finanzas en Costa Rica. Ordenada, bilingüe y cómoda llevando agendas, compras y comunicación con clientes.\n\nMe reconocen por convertir procesos desordenados en listas claras y por mantener a proveedores, pagos y reportes al día.",
    experience: [
      {
        id: uid("exp"),
        role: "Asistente Administrativa",
        company: "Grupo Comercial del Valle",
        location: "San José",
        start: "Feb 2022",
        end: "",
        current: true,
        bullets: [
          "Gestiono la agenda y los viáticos de un equipo comercial de 12 personas, reduciendo los cruces de reuniones casi a cero.",
          "Tramito más de 60 órdenes de compra al mes y las concilio contra facturas de proveedores en QuickBooks.",
          "Coordino la logística de ingreso de nuevo personal: equipo, accesos y agenda de la primera semana.",
        ],
      },
      {
        id: uid("exp"),
        role: "Recepcionista / Apoyo de Oficina",
        company: "Clínica Dental Sonríe",
        location: "Heredia",
        start: "Ene 2019",
        end: "Feb 2022",
        current: false,
        bullets: [
          "Atendí más de 40 llamadas diarias y la agenda de citas de cuatro odontólogos.",
          "Mantuve al día los expedientes de pacientes y el papeleo de seguros.",
        ],
      },
    ],
    education: [
      {
        id: uid("edu"),
        degree: "Diplomado en Administración de Empresas",
        school: "Universidad Técnica Nacional (UTN)",
        location: "Alajuela",
        start: "2016",
        end: "2018",
        note: "",
      },
    ],
    skills: [
      { id: uid("sk"), label: "Herramientas", items: ["Excel", "QuickBooks", "Google Workspace", "Slack"] },
      { id: uid("sk"), label: "Fortalezas", items: ["Agenda", "Compras", "Servicio al cliente", "Reportería"] },
    ],
    languages: [
      { id: uid("lng"), name: "Español", level: "Nativo" },
      { id: uid("lng"), name: "Inglés", level: "B2 · Intermedio-alto" },
    ],
    projects: [],
    references: "Disponibles a solicitud",
  };
}

export function sampleState(lang: CvLang = "es"): BuilderState {
  return {
    data: sampleResume(lang),
    settings: { template: "clasico", accent: ACCENTS[0], cvLang: lang, fontScale: 1, paper: "letter" },
    cover: { company: "", role: "", recipient: "", channel: "", hook: "", override: null },
  };
}
