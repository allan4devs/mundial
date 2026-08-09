export type TeamFlag = {
  code: string | null;
  emoji: string;
};

const COUNTRY_CODES: Record<string, string> = {
  argentina: "AR",
  brasil: "BR",
  brazil: "BR",
  mexico: "MX",
  "estados unidos": "US",
  usa: "US",
  "united states": "US",
  canada: "CA",
  uruguay: "UY",
  colombia: "CO",
  chile: "CL",
  ecuador: "EC",
  peru: "PE",
  paraguay: "PY",
  venezuela: "VE",
  bolivia: "BO",
  "costa rica": "CR",
  panama: "PA",
  honduras: "HN",
  jamaica: "JM",
  "el salvador": "SV",
  guatemala: "GT",
  haiti: "HT",
  "trinidad y tobago": "TT",
  "trinidad and tobago": "TT",
  curazao: "CW",
  curacao: "CW",
  "cabo verde": "CV",
  "cape verde": "CV",
  alemania: "DE",
  germany: "DE",
  francia: "FR",
  france: "FR",
  espana: "ES",
  spain: "ES",
  portugal: "PT",
  "paises bajos": "NL",
  netherlands: "NL",
  holanda: "NL",
  belgica: "BE",
  belgium: "BE",
  italia: "IT",
  italy: "IT",
  croacia: "HR",
  croatia: "HR",
  serbia: "RS",
  polonia: "PL",
  poland: "PL",
  suiza: "CH",
  switzerland: "CH",
  dinamarca: "DK",
  denmark: "DK",
  suecia: "SE",
  sweden: "SE",
  ucrania: "UA",
  ukraine: "UA",
  turquia: "TR",
  turkey: "TR",
  turkiye: "TR",
  austria: "AT",
  noruega: "NO",
  norway: "NO",
  "bosnia y herzegovina": "BA",
  "bosnia and herzegovina": "BA",
  hungria: "HU",
  hungary: "HU",
  albania: "AL",
  eslovenia: "SI",
  slovenia: "SI",
  rumania: "RO",
  romania: "RO",
  eslovaquia: "SK",
  slovakia: "SK",
  "republica checa": "CZ",
  "czech republic": "CZ",
  czechia: "CZ",
  grecia: "GR",
  greece: "GR",
  japon: "JP",
  japan: "JP",
  "corea del sur": "KR",
  "south korea": "KR",
  "korea republic": "KR",
  "arabia saudita": "SA",
  "saudi arabia": "SA",
  iran: "IR",
  "ir iran": "IR",
  australia: "AU",
  china: "CN",
  indonesia: "ID",
  uzbekistan: "UZ",
  qatar: "QA",
  irak: "IQ",
  iraq: "IQ",
  jordania: "JO",
  jordan: "JO",
  marruecos: "MA",
  morocco: "MA",
  senegal: "SN",
  nigeria: "NG",
  ghana: "GH",
  camerun: "CM",
  cameroon: "CM",
  tunez: "TN",
  tunisia: "TN",
  egipto: "EG",
  egypt: "EG",
  argelia: "DZ",
  algeria: "DZ",
  "costa de marfil": "CI",
  "ivory coast": "CI",
  "cote d'ivoire": "CI",
  mali: "ML",
  "rd congo": "CD",
  "congo dr": "CD",
  sudafrica: "ZA",
  "south africa": "ZA",
  "nueva zelanda": "NZ",
  "new zealand": "NZ",
  england: "GB-ENG",
  inglaterra: "GB-ENG",
  scotland: "GB-SCT",
  escocia: "GB-SCT",
  wales: "GB-WLS",
  gales: "GB-WLS",
};

export function normalizeTeamName(teamName: string) {
  return teamName
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function whiteFlag() {
  return String.fromCodePoint(0x1f3f3, 0xfe0f);
}

function countryCodeFlag(countryCode: string) {
  const code = countryCode.toUpperCase().replace(/[^A-Z]/g, "");
  if (code.length !== 2) return whiteFlag();

  return [...code].map((letter) => String.fromCodePoint(0x1f1e6 + letter.charCodeAt(0) - 65)).join("");
}

function subdivisionFlag(code: string) {
  const tags: Record<string, string> = {
    "GB-ENG": "gbeng",
    "GB-SCT": "gbsct",
    "GB-WLS": "gbwls",
  };
  const tag = tags[code.toUpperCase()];
  if (!tag) return whiteFlag();

  return [
    0x1f3f4,
    ...[...tag].map((letter) => 0xe0061 + letter.charCodeAt(0) - 97),
    0xe007f,
  ]
    .map((codePoint) => String.fromCodePoint(codePoint))
    .join("");
}

export function resolveTeamFlag(teamName: string): TeamFlag {
  const code = COUNTRY_CODES[normalizeTeamName(teamName)] ?? null;

  return {
    code,
    emoji: code ? (code.startsWith("GB-") ? subdivisionFlag(code) : countryCodeFlag(code)) : whiteFlag(),
  };
}

export function flagCdnUrl(code: string) {
  return `https://flagcdn.com/${code.toLowerCase()}.svg`;
}

export function getCountryFlag(teamName: string): string {
  return resolveTeamFlag(teamName).emoji;
}

const TEAM_CODES: Record<string, string> = {
  argentina: "ARG",
  brasil: "BRA",
  brazil: "BRA",
  mexico: "MEX",
  "estados unidos": "USA",
  usa: "USA",
  "united states": "USA",
  canada: "CAN",
  uruguay: "URU",
  colombia: "COL",
  chile: "CHI",
  ecuador: "ECU",
  peru: "PER",
  paraguay: "PAR",
  venezuela: "VEN",
  bolivia: "BOL",
  "costa rica": "CRC",
  panama: "PAN",
  honduras: "HON",
  jamaica: "JAM",
  "el salvador": "SLV",
  guatemala: "GUA",
  haiti: "HAI",
  "trinidad y tobago": "TTO",
  "trinidad and tobago": "TTO",
  curazao: "CUW",
  curacao: "CUW",
  "cabo verde": "CPV",
  "cape verde": "CPV",
  alemania: "GER",
  germany: "GER",
  francia: "FRA",
  france: "FRA",
  espana: "ESP",
  spain: "ESP",
  portugal: "POR",
  "paises bajos": "NED",
  netherlands: "NED",
  holanda: "NED",
  belgica: "BEL",
  belgium: "BEL",
  italia: "ITA",
  italy: "ITA",
  croacia: "CRO",
  croatia: "CRO",
  serbia: "SRB",
  polonia: "POL",
  poland: "POL",
  suiza: "SUI",
  switzerland: "SUI",
  dinamarca: "DEN",
  denmark: "DEN",
  suecia: "SWE",
  sweden: "SWE",
  ucrania: "UKR",
  ukraine: "UKR",
  turquia: "TUR",
  turkey: "TUR",
  turkiye: "TUR",
  austria: "AUT",
  noruega: "NOR",
  norway: "NOR",
  "bosnia y herzegovina": "BIH",
  "bosnia and herzegovina": "BIH",
  hungria: "HUN",
  hungary: "HUN",
  albania: "ALB",
  eslovenia: "SVN",
  slovenia: "SVN",
  rumania: "ROU",
  romania: "ROU",
  eslovaquia: "SVK",
  slovakia: "SVK",
  "republica checa": "CZE",
  "czech republic": "CZE",
  czechia: "CZE",
  grecia: "GRE",
  greece: "GRE",
  japon: "JPN",
  japan: "JPN",
  "corea del sur": "KOR",
  "south korea": "KOR",
  "korea republic": "KOR",
  "arabia saudita": "KSA",
  "saudi arabia": "KSA",
  iran: "IRN",
  "ir iran": "IRN",
  australia: "AUS",
  china: "CHN",
  indonesia: "IDN",
  uzbekistan: "UZB",
  qatar: "QAT",
  irak: "IRQ",
  iraq: "IRQ",
  jordania: "JOR",
  jordan: "JOR",
  marruecos: "MAR",
  morocco: "MAR",
  senegal: "SEN",
  nigeria: "NGA",
  ghana: "GHA",
  camerun: "CMR",
  cameroon: "CMR",
  tunez: "TUN",
  tunisia: "TUN",
  egipto: "EGY",
  egypt: "EGY",
  argelia: "ALG",
  algeria: "ALG",
  "costa de marfil": "CIV",
  "ivory coast": "CIV",
  "cote d'ivoire": "CIV",
  mali: "MLI",
  "rd congo": "COD",
  "congo dr": "COD",
  sudafrica: "RSA",
  "south africa": "RSA",
  "nueva zelanda": "NZL",
  "new zealand": "NZL",
  england: "ENG",
  inglaterra: "ENG",
  scotland: "SCO",
  escocia: "SCO",
  wales: "WAL",
  gales: "WAL",
};

export function teamCode(teamName: string) {
  const normalized = normalizeTeamName(teamName);
  const known = TEAM_CODES[normalized];
  if (known) return known;

  const letters = normalized.replace(/[^a-z0-9]/g, "").toUpperCase();
  return (letters || "TBD").slice(0, 3).padEnd(3, "-");
}
