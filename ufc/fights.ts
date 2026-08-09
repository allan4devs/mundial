export type UfcCardSection = "prelim" | "main";
export type UfcWeightClass =
  | "Flyweight"
  | "Bantamweight"
  | "Featherweight"
  | "Lightweight"
  | "Welterweight"
  | "Middleweight"
  | "Light Heavyweight"
  | "Heavyweight";

export type UfcFight = {
  id: string;
  number: number;
  section: UfcCardSection;
  sectionLabel: string;
  weightClass: UfcWeightClass;
  weightLbs: number;
  titleFight: boolean;
  titleLabel: string | null;
  scheduledRounds: 3 | 5;
  redCorner: string;
  blueCorner: string;
  redRecord: string | null;
  blueRecord: string | null;
  scheduledAt: string; // ISO string
  venue: string;
  winnerCorner: "red" | "blue" | null;
  method: "ko_tko" | "submission" | "decision" | null;
  endRound: number | null;
  endTime: string | null;
  sortOrder: number;
};

export const UFC_EVENT_NAME = "UFC Freedom 250";
export const UFC_EVENT_SUBTITLE = "Topuria vs. Gaethje";
export const UFC_EVENT_VENUE = "White House South Lawn, Washington D.C.";
export const UFC_EVENT_DATE = "2026-06-14";
export const UFC_TOTAL_FIGHTS = 7;

// All times are US Eastern → ISO UTC. Main card starts 8 PM ET = 00:00 UTC June 15.
// Prelims ~6 PM ET = 22:00 UTC June 14.
export const UFC_FIGHTS: UfcFight[] = [
  {
    id: "ufc-freedom-250-fight-1-lopes-garcia",
    number: 1,
    section: "prelim",
    sectionLabel: "Preliminares",
    weightClass: "Featherweight",
    weightLbs: 145,
    titleFight: false,
    titleLabel: null,
    scheduledRounds: 3,
    redCorner: "Diego Lopes",
    blueCorner: "Steve Garcia",
    redRecord: null,
    blueRecord: null,
    scheduledAt: "2026-06-14T22:00:00.000Z",
    venue: UFC_EVENT_VENUE,
    winnerCorner: null,
    method: null,
    endRound: null,
    endTime: null,
    sortOrder: 1,
  },
  {
    id: "ufc-freedom-250-fight-2-lewis-hokit",
    number: 2,
    section: "prelim",
    sectionLabel: "Preliminares",
    weightClass: "Heavyweight",
    weightLbs: 265,
    titleFight: false,
    titleLabel: null,
    scheduledRounds: 3,
    redCorner: "Derrick Lewis",
    blueCorner: "Josh Hokit",
    redRecord: null,
    blueRecord: null,
    scheduledAt: "2026-06-14T23:00:00.000Z",
    venue: UFC_EVENT_VENUE,
    winnerCorner: null,
    method: null,
    endRound: null,
    endTime: null,
    sortOrder: 2,
  },
  {
    id: "ufc-freedom-250-fight-3-nickal-daukaus",
    number: 3,
    section: "main",
    sectionLabel: "Main Card",
    weightClass: "Middleweight",
    weightLbs: 185,
    titleFight: false,
    titleLabel: null,
    scheduledRounds: 3,
    redCorner: "Bo Nickal",
    blueCorner: "Kyle Daukaus",
    redRecord: null,
    blueRecord: null,
    scheduledAt: "2026-06-15T00:00:00.000Z",
    venue: UFC_EVENT_VENUE,
    winnerCorner: null,
    method: null,
    endRound: null,
    endTime: null,
    sortOrder: 3,
  },
  {
    id: "ufc-freedom-250-fight-4-ruffy-chandler",
    number: 4,
    section: "main",
    sectionLabel: "Main Card",
    weightClass: "Lightweight",
    weightLbs: 155,
    titleFight: false,
    titleLabel: null,
    scheduledRounds: 3,
    redCorner: "Mauricio Ruffy",
    blueCorner: "Michael Chandler",
    redRecord: null,
    blueRecord: null,
    scheduledAt: "2026-06-15T00:30:00.000Z",
    venue: UFC_EVENT_VENUE,
    winnerCorner: null,
    method: null,
    endRound: null,
    endTime: null,
    sortOrder: 4,
  },
  {
    id: "ufc-freedom-250-fight-5-omalley-zahabi",
    number: 5,
    section: "main",
    sectionLabel: "Main Card",
    weightClass: "Bantamweight",
    weightLbs: 135,
    titleFight: false,
    titleLabel: null,
    scheduledRounds: 3,
    redCorner: "Sean O'Malley",
    blueCorner: "Aiemann Zahabi",
    redRecord: null,
    blueRecord: null,
    scheduledAt: "2026-06-15T01:00:00.000Z",
    venue: UFC_EVENT_VENUE,
    winnerCorner: null,
    method: null,
    endRound: null,
    endTime: null,
    sortOrder: 5,
  },
  {
    id: "ufc-freedom-250-fight-6-pereira-gane",
    number: 6,
    section: "main",
    sectionLabel: "Main Card",
    weightClass: "Heavyweight",
    weightLbs: 265,
    titleFight: true,
    titleLabel: "Interim UFC Heavyweight Championship",
    scheduledRounds: 5,
    redCorner: "Alex Pereira",
    blueCorner: "Ciryl Gane",
    redRecord: null,
    blueRecord: null,
    scheduledAt: "2026-06-15T01:30:00.000Z",
    venue: UFC_EVENT_VENUE,
    winnerCorner: null,
    method: null,
    endRound: null,
    endTime: null,
    sortOrder: 6,
  },
  {
    id: "ufc-freedom-250-fight-7-topuria-gaethje",
    number: 7,
    section: "main",
    sectionLabel: "Main Card",
    weightClass: "Lightweight",
    weightLbs: 155,
    titleFight: true,
    titleLabel: "UFC Lightweight Championship",
    scheduledRounds: 5,
    redCorner: "Ilia Topuria",
    blueCorner: "Justin Gaethje",
    redRecord: null,
    blueRecord: null,
    scheduledAt: "2026-06-15T02:30:00.000Z",
    venue: UFC_EVENT_VENUE,
    winnerCorner: null,
    method: null,
    endRound: null,
    endTime: null,
    sortOrder: 7,
  },
];
