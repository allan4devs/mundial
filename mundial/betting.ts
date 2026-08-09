export type BettingFavoriteSide = "home" | "draw" | "away";
export type BettingMarket = "public_bets" | "h2h_odds" | "bookmaker_consensus";

export type BettingFavorite = {
  side: BettingFavoriteSide | null;
  teamName: string | null;
  source: string;
  sourceUrl: string;
  bookmaker: string;
  market: BettingMarket;
  marketLabel: string;
  homePrice: number | null;
  drawPrice: number | null;
  awayPrice: number | null;
  homeBetPct: number | null;
  drawBetPct: number | null;
  awayBetPct: number | null;
  homeImpliedPct: number | null;
  drawImpliedPct: number | null;
  awayImpliedPct: number | null;
  confidencePct: number | null;
  updatedAt: string | null;
  note: string;
};

export type BettingFavoriteInput = Partial<
  Pick<
    BettingFavorite,
    | "source"
    | "sourceUrl"
    | "bookmaker"
    | "market"
    | "homePrice"
    | "drawPrice"
    | "awayPrice"
    | "homeBetPct"
    | "drawBetPct"
    | "awayBetPct"
    | "note"
  >
> & {
  updatedAt?: Date | string | null;
};

const MARKET_LABELS: Record<BettingMarket, string> = {
  public_bets: "Apuestas publicas",
  h2h_odds: "Cuotas 1X2",
  bookmaker_consensus: "Consenso casas",
};

function cleanString(value: unknown, maxLength: number) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanUrl(value: unknown) {
  const raw = cleanString(value, 240);
  if (!raw) return "";

  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function cleanNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanPercent(value: unknown) {
  const parsed = cleanNumber(value);
  if (parsed === null || parsed < 0 || parsed > 100) return null;
  return Math.round(parsed);
}

function cleanDecimalPrice(value: unknown) {
  const parsed = cleanNumber(value);
  if (parsed === null || parsed < 1.01 || parsed > 1000) return null;
  return Number(parsed.toFixed(3));
}

function cleanMarket(value: unknown, hasPublicBetData: boolean): BettingMarket {
  if (value === "public_bets" || value === "h2h_odds" || value === "bookmaker_consensus") {
    return value;
  }

  return hasPublicBetData ? "public_bets" : "h2h_odds";
}

function toIsoString(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function computeImpliedPercentages(prices: Record<BettingFavoriteSide, number | null>) {
  const raw = {
    home: prices.home ? 1 / prices.home : null,
    draw: prices.draw ? 1 / prices.draw : null,
    away: prices.away ? 1 / prices.away : null,
  };
  const total = Object.values(raw).reduce<number>((sum, value) => sum + (value ?? 0), 0);

  if (total <= 0) {
    return { home: null, draw: null, away: null } satisfies Record<BettingFavoriteSide, number | null>;
  }

  return {
    home: raw.home !== null ? Math.round((raw.home / total) * 100) : null,
    draw: raw.draw !== null ? Math.round((raw.draw / total) * 100) : null,
    away: raw.away !== null ? Math.round((raw.away / total) * 100) : null,
  } satisfies Record<BettingFavoriteSide, number | null>;
}

function chooseSide(values: Record<BettingFavoriteSide, number | null>) {
  const entries = Object.entries(values)
    .filter((entry): entry is [BettingFavoriteSide, number] => typeof entry[1] === "number")
    .sort((a, b) => b[1] - a[1]);

  if (!entries.length) return { side: null, value: null };
  if (entries.length > 1 && entries[0][1] === entries[1][1]) return { side: null, value: entries[0][1] };

  return { side: entries[0][0], value: entries[0][1] };
}

function sideTeamName(side: BettingFavoriteSide | null, homeTeam: string, awayTeam: string) {
  if (side === "home") return homeTeam;
  if (side === "away") return awayTeam;
  if (side === "draw") return "Empate";
  return null;
}

export function serializeBettingFavorite(
  raw: unknown,
  teams: { homeTeam: string; awayTeam: string }
): BettingFavorite | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as BettingFavoriteInput;

  const homePrice = cleanDecimalPrice(value.homePrice);
  const drawPrice = cleanDecimalPrice(value.drawPrice);
  const awayPrice = cleanDecimalPrice(value.awayPrice);
  const homeBetPct = cleanPercent(value.homeBetPct);
  const drawBetPct = cleanPercent(value.drawBetPct);
  const awayBetPct = cleanPercent(value.awayBetPct);
  const hasPublicBetData = [homeBetPct, drawBetPct, awayBetPct].some((pct) => pct !== null);
  const market = cleanMarket(value.market, hasPublicBetData);
  const implied = computeImpliedPercentages({ home: homePrice, draw: drawPrice, away: awayPrice });
  const source = cleanString(value.source, 80);
  const bookmaker = cleanString(value.bookmaker, 80);
  const sourceUrl = cleanUrl(value.sourceUrl);
  const note = cleanString(value.note, 160);

  const publicChoice = chooseSide({ home: homeBetPct, draw: drawBetPct, away: awayBetPct });
  const oddsChoice = chooseSide(implied);
  const choice = hasPublicBetData ? publicChoice : oddsChoice;

  const hasAnyMarketData =
    hasPublicBetData || [homePrice, drawPrice, awayPrice].some((price) => price !== null);
  if (!hasAnyMarketData && !source && !bookmaker && !note) return null;

  return {
    side: choice.side,
    teamName: sideTeamName(choice.side, teams.homeTeam, teams.awayTeam),
    source,
    sourceUrl,
    bookmaker,
    market,
    marketLabel: MARKET_LABELS[market],
    homePrice,
    drawPrice,
    awayPrice,
    homeBetPct,
    drawBetPct,
    awayBetPct,
    homeImpliedPct: implied.home,
    drawImpliedPct: implied.draw,
    awayImpliedPct: implied.away,
    confidencePct: choice.value,
    updatedAt: toIsoString(value.updatedAt),
    note,
  };
}

export function bettingFavoriteLabel(favorite: BettingFavorite) {
  if (!favorite.side || !favorite.teamName) return "Sin favorito claro";
  if (favorite.confidencePct !== null) return `${favorite.teamName} ${favorite.confidencePct}%`;
  return favorite.teamName;
}
