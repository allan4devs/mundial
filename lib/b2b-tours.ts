export interface B2BTour {
  id: string;
  name: string;
  description: string;
  duration: string;
  retailPricePerPax: number;
  currency: string;
  minPax: number;
  maxPax: number;
  includes: string[];
  location: string;
  imageUrl?: string;
}

export const B2B_TOURS: B2BTour[] = [
  {
    id: "tour-ciudad-esmeralda",
    name: "Tour Ciudad Esmeralda · Cañón del Río La Vieja",
    description:
      "Cañón del Río La Vieja: sendero, río y pozas hasta la Cascada El Zafiro. Grupos chicos, guías locales y salida sujeta al clima y al nivel seguro del río.",
    duration: "3–4 horas",
    retailPricePerPax: 25000,
    currency: "CRC",
    minPax: 1,
    maxPax: 20,
    includes: [
      "Guía certificado",
      "Equipo de seguridad",
      "Seguro de accidentes",
      "Acceso al área protegida",
    ],
    location: "Ciudad Esmeralda, Costa Rica",
  },
];
