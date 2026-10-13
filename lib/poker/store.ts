import type { Db } from "mongodb";
import { getDb } from "@/lib/helpers/mongodb";
import { PokerTable } from "@/app/(page_routes)/poker/poker-engine.js";

const TABLE_ID = "MAIN";
const TABLES = "poker_tables";
const USERS = "poker_users";
const EVENTS = "poker_hand_events";
export const DAILY_CHIPS = 1_000_000;
export const SMALL_BLIND = 5_000;
export const BIG_BLIND = 10_000;
export const MIN_BUY_IN = 100_000;

type PokerPlayer = { id: string; name: string; stack: number; seat: number; isBot: false; hole: string[]; bet: number; totalBet: number; folded: boolean; allIn: boolean; acted: boolean; departed?: boolean };
type Winner = { seat: number; name: string; handName: string; amount: number };
type EngineSnapshot = { numSeats: number; startingStack: number; smallBlind: number; bigBlind: number; players: Array<PokerPlayer | null>; deck: string[]; community: string[]; pot: number; sidePots: unknown[]; street: string; dealerIndex: number; actionIndex: number; currentBet: number; minRaise: number; lastAggressor: number; handNumber: number; history: unknown[]; winners: Winner[]; heroSeat: number };
export type PokerTableDoc = { _id: string; state: EngineSnapshot; version: number; recentActionIds: string[]; lastWinners: Winner[]; lastCompletedHand: number; createdAt: Date; updatedAt: Date };
type PokerUserDoc = { _id: string; name: string; balance: number; seatedAt: number | null; lastDailyGrant: string; createdAt: Date; updatedAt: Date };
type PokerEventDoc = { tableId: string; actionId: string; userId: string; handNumber: number; type: string; payload: Record<string, unknown>; state: EngineSnapshot; version: number; createdAt: Date };

let indexesPromise: Promise<void> | null = null;
const tables = (db: Db) => db.collection<PokerTableDoc>(TABLES);
const users = (db: Db) => db.collection<PokerUserDoc>(USERS);
const events = (db: Db) => db.collection<PokerEventDoc>(EVENTS);

function costaRicaDay(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

async function ensureIndexes(db: Db) {
  if (!indexesPromise) indexesPromise = Promise.all([
    users(db).createIndex({ updatedAt: -1 }),
    events(db).createIndex({ tableId: 1, actionId: 1 }, { unique: true }),
    events(db).createIndex({ tableId: 1, handNumber: 1, createdAt: 1 }),
  ]).then(() => undefined).catch((error) => { indexesPromise = null; throw error; });
  await indexesPromise;
}

function freshEngine() {
  const engine = new PokerTable({ numSeats: 6, startingStack: 0, smallBlind: SMALL_BLIND, bigBlind: BIG_BLIND });
  engine.players = Array.from({ length: 6 }, () => null);
  return engine;
}

function snapshot(engine: InstanceType<typeof PokerTable>): EngineSnapshot {
  return { numSeats: 6, startingStack: 0, smallBlind: SMALL_BLIND, bigBlind: BIG_BLIND, players: structuredClone(engine.players), deck: [...engine.deck], community: [...engine.community], pot: engine.pot, sidePots: structuredClone(engine.sidePots), street: engine.street, dealerIndex: engine.dealerIndex, actionIndex: engine.actionIndex, currentBet: engine.currentBet, minRaise: engine.minRaise, lastAggressor: engine.lastAggressor, handNumber: engine.handNumber, history: structuredClone(engine.history), winners: structuredClone(engine.winners), heroSeat: engine.heroSeat };
}

function restore(doc: PokerTableDoc) {
  return Object.assign(freshEngine(), structuredClone(doc.state)) as InstanceType<typeof PokerTable>;
}

async function getOrCreateTable(db: Db) {
  const existing = await tables(db).findOne({ _id: TABLE_ID });
  if (existing) return existing;
  const now = new Date();
  const doc: PokerTableDoc = { _id: TABLE_ID, state: snapshot(freshEngine()), version: 1, recentActionIds: [], lastWinners: [], lastCompletedHand: 0, createdAt: now, updatedAt: now };
  await tables(db).updateOne({ _id: TABLE_ID }, { $setOnInsert: doc }, { upsert: true });
  return (await tables(db).findOne({ _id: TABLE_ID }))!;
}

export async function getOrCreatePokerUser(userId: string, name: string) {
  const db = await getDb();
  await ensureIndexes(db);
  const day = costaRicaDay();
  const now = new Date();
  await users(db).updateOne({ _id: userId }, { $setOnInsert: { _id: userId, name: name.slice(0, 30), balance: DAILY_CHIPS, seatedAt: null, lastDailyGrant: day, createdAt: now, updatedAt: now } }, { upsert: true });
  await users(db).updateOne({ _id: userId, lastDailyGrant: { $ne: day } }, { $inc: { balance: DAILY_CHIPS }, $set: { lastDailyGrant: day, updatedAt: now, name: name.slice(0, 30) } });
  return users(db).findOne({ _id: userId });
}

function maybeStartNextHand(engine: InstanceType<typeof PokerTable>) {
  if (engine.street !== "waiting" && engine.street !== "showdown") return;
  engine.players = engine.players.map((player) => player?.departed ? null : player);
  if (engine.getActivePlayers().length >= 2 && !engine.startHand().ok) throw new Error("Unable to start poker hand");
}

function publicState(doc: PokerTableDoc, userId: string) {
  const engine = restore(doc);
  const seat = engine.players.findIndex((player) => player?.id === userId);
  engine.heroSeat = seat;
  return { ...engine.getState(), version: doc.version, heroSeat: seat, legalActions: seat >= 0 && engine.actionIndex === seat ? engine.getLegalActions() : [], lastWinners: doc.lastWinners, lastCompletedHand: doc.lastCompletedHand };
}

export async function getPokerLobby(userId: string, name: string) {
  const db = await getDb();
  const [profile, table] = await Promise.all([getOrCreatePokerUser(userId, name), getOrCreateTable(db)]);
  return { profile, state: publicState(table, userId) };
}

async function saveMutation(db: Db, current: PokerTableDoc, engine: InstanceType<typeof PokerTable>, userId: string, actionId: string, type: string, payload: Record<string, unknown>, lastWinners = current.lastWinners, lastCompletedHand = current.lastCompletedHand) {
  const now = new Date();
  const nextState = snapshot(engine);
  const result = await tables(db).updateOne({ _id: TABLE_ID, version: current.version, recentActionIds: { $ne: actionId } }, { $set: { state: nextState, lastWinners, lastCompletedHand, updatedAt: now }, $inc: { version: 1 }, $push: { recentActionIds: { $each: [actionId], $slice: -100 } } });
  if (result.modifiedCount !== 1) return { ok: false as const, status: 409, error: "stale_table_version" };
  const version = current.version + 1;
  await events(db).insertOne({ tableId: TABLE_ID, actionId, userId, handNumber: engine.handNumber, type, payload, state: nextState, version, createdAt: now }).catch((error) => { if ((error as { code?: number }).code !== 11000) console.error("Poker audit event failed", error); });
  return { ok: true as const, state: publicState({ ...current, state: nextState, lastWinners, lastCompletedHand, version }, userId) };
}

export async function sitAtPokerTable(userId: string, name: string, buyInInput: number, actionId: string) {
  const db = await getDb();
  const profile = await getOrCreatePokerUser(userId, name);
  const buyIn = Math.floor(buyInInput);
  if (!profile || buyIn < MIN_BUY_IN || buyIn > profile.balance) return { ok: false as const, status: 400, error: "invalid_buy_in" };
  const current = await getOrCreateTable(db);
  const engine = restore(current);
  if (engine.players.some((player) => player?.id === userId)) return { ok: false as const, status: 409, error: "already_seated" };
  const seat = engine.players.findIndex((player) => !player);
  if (seat < 0) return { ok: false as const, status: 409, error: "table_full" };
  const debit = await users(db).updateOne({ _id: userId, balance: { $gte: buyIn }, seatedAt: null }, { $inc: { balance: -buyIn }, $set: { seatedAt: seat, updatedAt: new Date() } });
  if (debit.modifiedCount !== 1) return { ok: false as const, status: 409, error: "balance_changed" };
  engine.players[seat] = { id: userId, name: profile.name, stack: buyIn, seat, isBot: false, hole: [], bet: 0, totalBet: 0, folded: false, allIn: false, acted: false };
  maybeStartNextHand(engine);
  const saved = await saveMutation(db, current, engine, userId, actionId, "sit", { seat, buyIn });
  if (!saved.ok) await users(db).updateOne({ _id: userId }, { $inc: { balance: buyIn }, $set: { seatedAt: null } });
  return saved;
}

export async function standFromPokerTable(userId: string, actionId: string) {
  const db = await getDb();
  const current = await getOrCreateTable(db);
  const engine = restore(current);
  const seat = engine.players.findIndex((player) => player?.id === userId);
  if (seat < 0) return { ok: false as const, status: 409, error: "not_seated" };
  const player = engine.players[seat]!;
  const cashOut = player.stack;
  const handIsActive = engine.street !== "waiting" && engine.street !== "showdown";
  if (handIsActive) {
    if (engine.actionIndex === seat) engine.applyAction({ type: "fold" });
    else {
      player.folded = true;
      player.acted = true;
      if (engine.getInHandPlayers().length <= 1) engine.advance();
    }
    player.stack = 0;
    player.allIn = true;
    player.departed = true;
  } else {
    engine.players[seat] = null;
  }
  let lastWinners = current.lastWinners;
  let lastCompletedHand = current.lastCompletedHand;
  if (engine.street === "showdown") { lastWinners = structuredClone(engine.winners); lastCompletedHand = engine.handNumber; }
  maybeStartNextHand(engine);
  const saved = await saveMutation(db, current, engine, userId, actionId, "stand", { seat, cashOut }, lastWinners, lastCompletedHand);
  if (saved.ok) await users(db).updateOne({ _id: userId }, { $inc: { balance: cashOut }, $set: { seatedAt: null, updatedAt: new Date() } });
  return saved;
}

export async function actAtPokerTable(userId: string, actionId: string, action: Record<string, unknown>) {
  const db = await getDb();
  const current = await getOrCreateTable(db);
  if (current.recentActionIds.includes(actionId)) return { ok: true as const, state: publicState(current, userId), replayed: true };
  const engine = restore(current);
  const seat = engine.players.findIndex((player) => player?.id === userId);
  if (seat < 0 || engine.actionIndex !== seat) return { ok: false as const, status: 400, error: "not_your_turn" };
  const type = typeof action.type === "string" ? action.type : "";
  const legal = engine.getLegalActions().find((candidate) => candidate.type === type);
  if (!legal) return { ok: false as const, status: 400, error: "illegal_action" };
  if ((type === "bet" || type === "raise") && (typeof action.amount !== "number" || action.amount < (legal.min ?? 0) || action.amount > (legal.max ?? 0))) return { ok: false as const, status: 400, error: "invalid_bet_amount" };
  const result = engine.applyAction(action);
  if (!result.ok) return { ok: false as const, status: 400, error: "invalid_action" };
  let lastWinners = current.lastWinners;
  let lastCompletedHand = current.lastCompletedHand;
  if (engine.street === "showdown") { lastWinners = structuredClone(engine.winners); lastCompletedHand = engine.handNumber; }
  maybeStartNextHand(engine);
  return saveMutation(db, current, engine, userId, actionId, "action", { action }, lastWinners, lastCompletedHand);
}

export async function watchPokerTable(userId: string, name: string) {
  const db = await getDb();
  const initial = await getPokerLobby(userId, name);
  const stream = tables(db).watch([{ $match: { "documentKey._id": TABLE_ID } }], { fullDocument: "updateLookup", maxAwaitTimeMS: 20_000 });
  return { stream, initial };
}

export async function serializeLatestPokerState(userId: string) {
  const db = await getDb();
  return publicState(await getOrCreateTable(db), userId);
}
