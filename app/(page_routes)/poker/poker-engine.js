/**
 * Pure Texas Hold'em engine
 * No DOM, no network. Ready to be driven by UI or by a backend API.
 */

const RANKS = '23456789TJQKA';
const SUITS = 'cdhs'; // clubs diamonds hearts spades
const RANK_VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'T':10,'J':11,'Q':12,'K':13,'A':14 };

function createDeck() {
  const deck = [];
  for (const r of RANKS) {
    for (const s of SUITS) {
      deck.push(r + s);
    }
  }
  return deck;
}

function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

// ---- Hand Evaluation (best 5 of 5-7 cards) ----
function cardRank(c) { return RANK_VALUES[c[0]]; }
function cardSuit(c) { return c[1]; }

function evaluateHand(cards) {
  // Returns { score: number (higher better), name: string, ranks: number[] }
  if (cards.length < 5) return { score: 0, name: 'Incomplete', ranks: [] };

  const combos = combinations(cards, 5);
  let best = null;
  for (const five of combos) {
    const ev = eval5(five);
    if (!best || ev.score > best.score) best = ev;
  }
  return best;
}

function combinations(arr, k) {
  const res = [];
  function helper(start, combo) {
    if (combo.length === k) {
      res.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  }
  helper(0, []);
  return res;
}

function eval5(cards) {
  const ranks = cards.map(cardRank).sort((a, b) => b - a);
  const suits = cards.map(cardSuit);
  const isFlush = suits.every(s => s === suits[0]);
  const isStraight = checkStraight(ranks);
  const counts = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([r, c]) => ({ rank: +r, count: c }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);

  let category = 0;
  let name = 'High Card';
  let scoreRanks = ranks;

  if (isStraight && isFlush) {
    category = 8;
    name = ranks[0] === 14 && ranks[4] === 10 ? 'Royal Flush' : 'Straight Flush';
    scoreRanks = [isStraight];
  } else if (groups[0].count === 4) {
    category = 7;
    name = 'Four of a Kind';
    scoreRanks = [groups[0].rank, groups[1].rank];
  } else if (groups[0].count === 3 && groups[1].count === 2) {
    category = 6;
    name = 'Full House';
    scoreRanks = [groups[0].rank, groups[1].rank];
  } else if (isFlush) {
    category = 5;
    name = 'Flush';
    scoreRanks = ranks;
  } else if (isStraight) {
    category = 4;
    name = 'Straight';
    scoreRanks = [isStraight];
  } else if (groups[0].count === 3) {
    category = 3;
    name = 'Three of a Kind';
    scoreRanks = [groups[0].rank, ...groups.slice(1).map(g => g.rank)];
  } else if (groups[0].count === 2 && groups[1].count === 2) {
    category = 2;
    name = 'Two Pair';
    const pairs = [groups[0].rank, groups[1].rank].sort((a,b)=>b-a);
    scoreRanks = [...pairs, groups[2].rank];
  } else if (groups[0].count === 2) {
    category = 1;
    name = 'One Pair';
    scoreRanks = [groups[0].rank, ...groups.slice(1).map(g => g.rank)];
  }

  // Pack score: category * 1e10 + ranks
  let score = category * 1e10;
  for (let i = 0; i < scoreRanks.length; i++) {
    score += scoreRanks[i] * Math.pow(100, 4 - i);
  }
  return { score, name, ranks: scoreRanks };
}

function checkStraight(sortedDesc) {
  // Handle A-5
  const unique = [...new Set(sortedDesc)];
  if (unique.length < 5) return 0;
  // Normal
  for (let i = 0; i <= unique.length - 5; i++) {
    if (unique[i] - unique[i+4] === 4) return unique[i];
  }
  // Wheel A5432
  if (unique.includes(14) && unique.includes(5) && unique.includes(4) && unique.includes(3) && unique.includes(2)) {
    return 5;
  }
  return 0;
}

// ---- Game State Machine ----
class PokerTable {
  constructor(options = {}) {
    this.numSeats = options.numSeats || 6;
    this.startingStack = options.startingStack || 1000;
    this.smallBlind = options.smallBlind || 10;
    this.bigBlind = options.bigBlind || 20;
    this.players = [];
    this.deck = [];
    this.community = [];
    this.pot = 0;
    this.sidePots = [];
    this.street = 'waiting'; // waiting | preflop | flop | turn | river | showdown
    this.dealerIndex = 0;
    this.actionIndex = -1;
    this.currentBet = 0;
    this.minRaise = 0;
    this.lastAggressor = -1;
    this.handNumber = 0;
    this.history = [];
    this.winners = [];
    this.heroSeat = 0; // fixed hero
  }

  sitPlayers(botCount = 5) {
    this.players = [];
    // Seat 0 is always hero
    this.players.push({
      id: 'hero',
      name: 'You',
      stack: this.startingStack,
      seat: 0,
      isBot: false,
      hole: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      acted: false
    });
    const botNames = ['AceBot', 'KingAI', 'QueenBot', 'JackAI', 'TenBot', 'NineAI'];
    for (let i = 1; i <= botCount && i < this.numSeats; i++) {
      this.players.push({
        id: 'bot' + i,
        name: botNames[i - 1] || `Bot ${i}`,
        stack: this.startingStack,
        seat: i,
        isBot: true,
        hole: [],
        bet: 0,
        totalBet: 0,
        folded: false,
        allIn: false,
        acted: false
      });
    }
    // Fill empty seats as empty
    while (this.players.length < this.numSeats) {
      this.players.push(null);
    }
  }

  getActivePlayers() {
    return this.players.filter(p => p && p.stack > 0);
  }

  getInHandPlayers() {
    return this.players.filter(p => p && !p.folded && p.stack + p.bet > 0);
  }

  startHand() {
    const active = this.getActivePlayers();
    if (active.length < 2) {
      return { ok: false, error: 'Need at least 2 players with chips' };
    }

    this.handNumber++;
    this.deck = shuffle(createDeck());
    this.community = [];
    this.pot = 0;
    this.sidePots = [];
    this.street = 'preflop';
    this.currentBet = 0;
    this.minRaise = this.bigBlind;
    this.lastAggressor = -1;
    this.winners = [];
    this.history = [];

    // Reset players
    for (const p of this.players) {
      if (!p) continue;
      p.hole = [];
      p.bet = 0;
      p.totalBet = 0;
      p.folded = false;
      p.allIn = false;
      p.acted = false;
    }

    // Move dealer
    this.dealerIndex = this.nextOccupied(this.dealerIndex);
    // Deal hole cards
    for (let i = 0; i < 2; i++) {
      for (const p of this.players) {
        if (p && p.stack > 0) {
          p.hole.push(this.deck.pop());
        }
      }
    }

    // Post blinds
    const headsUp = active.length === 2;
    const sbIdx = headsUp ? this.dealerIndex : this.nextOccupied(this.dealerIndex);
    const bbIdx = this.nextOccupied(sbIdx);
    this.postBlind(sbIdx, this.smallBlind);
    this.postBlind(bbIdx, this.bigBlind);
    this.currentBet = Math.max(this.players[sbIdx].bet, this.players[bbIdx].bet);
    this.minRaise = this.bigBlind;

    // First to act (UTG)
    this.actionIndex = this.nextToAct(bbIdx);
    this.lastAggressor = bbIdx;

    return { ok: true };
  }

  nextOccupied(from) {
    let i = (from + 1) % this.numSeats;
    let guard = 0;
    while ((!this.players[i] || this.players[i].stack <= 0) && guard < this.numSeats) {
      i = (i + 1) % this.numSeats;
      guard++;
    }
    return i;
  }

  nextToAct(from) {
    let i = (from + 1) % this.numSeats;
    let guard = 0;
    while (guard < this.numSeats) {
      const p = this.players[i];
      if (p && !p.folded && !p.allIn && p.stack > 0) return i;
      i = (i + 1) % this.numSeats;
      guard++;
    }
    return -1;
  }

  postBlind(seatIdx, amount) {
    const p = this.players[seatIdx];
    if (!p) return;
    const actual = Math.min(amount, p.stack);
    p.stack -= actual;
    p.bet += actual;
    p.totalBet += actual;
    this.pot += actual;
    if (p.stack === 0) p.allIn = true;
  }

  // Legal actions for current player
  getLegalActions() {
    const p = this.players[this.actionIndex];
    if (!p || p.folded || p.allIn) return [];

    const toCall = this.currentBet - p.bet;
    const actions = [];

    if (toCall === 0) {
      actions.push({ type: 'check' });
      if (p.stack >= this.minRaise) {
        actions.push({ type: 'bet', min: this.minRaise, max: p.stack });
      }
    } else {
      actions.push({ type: 'fold' });
      if (toCall < p.stack) {
        actions.push({ type: 'call', amount: toCall });
      }
      const maxRaiseTo = p.stack + p.bet;
      if (!p.acted && maxRaiseTo >= this.currentBet + this.minRaise) {
        actions.push({ type: 'raise', min: this.currentBet + this.minRaise, max: maxRaiseTo });
      }
    }
    // All-in always possible if stack > 0
    if (p.stack > 0) {
      actions.push({ type: 'allin', amount: p.stack });
    }
    return actions;
  }

  applyAction(action) {
    const p = this.players[this.actionIndex];
    if (!p) return { ok: false, error: 'No player to act' };

    const toCall = this.currentBet - p.bet;
    let msg = '';

    switch (action.type) {
      case 'fold':
        p.folded = true;
        p.acted = true;
        msg = `${p.name} folds`;
        break;

      case 'check':
        if (toCall > 0) return { ok: false, error: 'Cannot check' };
        p.acted = true;
        msg = `${p.name} checks`;
        break;

      case 'call': {
        if (toCall <= 0) return { ok: false, error: 'Nothing to call' };
        const amount = Math.min(toCall, p.stack);
        p.stack -= amount;
        p.bet += amount;
        p.totalBet += amount;
        this.pot += amount;
        if (p.stack === 0) p.allIn = true;
        p.acted = true;
        msg = `${p.name} calls ${amount}`;
        break;
      }

      case 'bet':
      case 'raise': {
        const total = action.amount; // total bet this street
        const raiseTo = Math.min(total, p.stack + p.bet);
        const putIn = raiseTo - p.bet;
        if (putIn <= 0) return { ok: false, error: 'Invalid raise' };

        const raiseSize = raiseTo - this.currentBet;
        if (action.type === 'bet' && this.currentBet !== 0) return { ok: false, error: 'Cannot bet into an existing bet' };
        if (action.type === 'raise' && (this.currentBet === 0 || p.acted)) return { ok: false, error: 'Betting is not reopened' };
        if (!Number.isFinite(total) || raiseSize < this.minRaise) return { ok: false, error: 'Raise is below the minimum' };

        p.stack -= putIn;
        p.bet = raiseTo;
        p.totalBet += putIn;
        this.pot += putIn;
        if (p.stack === 0) p.allIn = true;

        if (raiseTo > this.currentBet) {
          this.minRaise = Math.max(this.minRaise, raiseTo - this.currentBet);
          this.currentBet = raiseTo;
          this.lastAggressor = this.actionIndex;
          // reset acted for others
          for (const pl of this.players) {
            if (pl && pl !== p && !pl.folded && !pl.allIn) pl.acted = false;
          }
        }
        p.acted = true;
        msg = `${p.name} ${action.type === 'bet' ? 'bets' : 'raises to'} ${raiseTo}`;
        break;
      }

      case 'allin': {
        const putIn = p.stack;
        p.bet += putIn;
        p.totalBet += putIn;
        this.pot += putIn;
        p.stack = 0;
        p.allIn = true;
        p.acted = true;
        if (p.bet > this.currentBet) {
          const raiseSize = p.bet - this.currentBet;
          const fullRaise = raiseSize >= this.minRaise;
          if (fullRaise) this.minRaise = raiseSize;
          this.currentBet = p.bet;
          this.lastAggressor = this.actionIndex;
          if (fullRaise) {
            for (const pl of this.players) {
              if (pl && pl !== p && !pl.folded && !pl.allIn) pl.acted = false;
            }
          }
        }
        msg = `${p.name} goes all-in (${p.bet})`;
        break;
      }

      default:
        return { ok: false, error: 'Unknown action' };
    }

    this.history.push({ seat: this.actionIndex, action, msg });

    // Advance
    return this.advance();
  }

  advance() {
    // Check if only one left
    const inHand = this.getInHandPlayers();
    if (inHand.length === 1) {
      return this.endHand(inHand[0]);
    }

    // Check if betting round complete
    const needsAction = this.players.some(p =>
      p && !p.folded && !p.allIn && (!p.acted || p.bet < this.currentBet)
    );

    if (!needsAction) {
      return this.nextStreet();
    }

    // Next player
    this.actionIndex = this.nextToAct(this.actionIndex);
    if (this.actionIndex === -1) {
      return this.nextStreet();
    }

    return { ok: true, next: this.actionIndex };
  }

  nextStreet() {
    // Collect bets into pot (already tracked)
    for (const p of this.players) {
      if (p) {
        p.bet = 0;
        p.acted = false;
      }
    }
    this.currentBet = 0;
    this.minRaise = this.bigBlind;

    if (this.street === 'preflop') {
      this.street = 'flop';
      this.community.push(this.deck.pop(), this.deck.pop(), this.deck.pop());
    } else if (this.street === 'flop') {
      this.street = 'turn';
      this.community.push(this.deck.pop());
    } else if (this.street === 'turn') {
      this.street = 'river';
      this.community.push(this.deck.pop());
    } else if (this.street === 'river') {
      return this.showdown();
    }

    // First to act postflop: left of dealer
    this.actionIndex = this.nextToAct(this.dealerIndex);
    this.lastAggressor = -1;

    // If everyone all-in, auto runout
    const playersWhoCanAct = this.players.filter(p => p && !p.folded && !p.allIn && p.stack > 0);
    if (playersWhoCanAct.length < 2) {
      return this.runout();
    }

    return { ok: true, street: this.street };
  }

  runout() {
    while (this.community.length < 5) {
      this.community.push(this.deck.pop());
    }
    this.street = 'river';
    return this.showdown();
  }

  showdown() {
    this.street = 'showdown';
    const contenders = this.players.filter(p => p && !p.folded);
    if (contenders.length === 0) return { ok: false };

    // Evaluate
    const results = contenders.map(p => {
      const allCards = [...p.hole, ...this.community];
      const ev = evaluateHand(allCards);
      return { player: p, ...ev };
    });

    results.sort((a, b) => b.score - a.score);

    // Build main/side pots from total contributions so different buy-ins and
    // short all-ins are paid correctly.
    const contributionLevels = [...new Set(this.players
      .filter(Boolean)
      .map(player => player.totalBet)
      .filter(amount => amount > 0))].sort((a, b) => a - b);
    const awards = new Map();
    let previousLevel = 0;

    for (const level of contributionLevels) {
      const contributors = this.players.filter(player => player && player.totalBet >= level);
      const potAmount = (level - previousLevel) * contributors.length;
      const eligible = results.filter(result => !result.player.folded && result.player.totalBet >= level);
      if (!eligible.length || potAmount <= 0) {
        previousLevel = level;
        continue;
      }
      const potBestScore = Math.max(...eligible.map(result => result.score));
      const potWinners = eligible.filter(result => result.score === potBestScore)
        .sort((a, b) => {
          const distanceA = (a.player.seat - this.dealerIndex - 1 + this.numSeats) % this.numSeats;
          const distanceB = (b.player.seat - this.dealerIndex - 1 + this.numSeats) % this.numSeats;
          return distanceA - distanceB;
        });
      const share = Math.floor(potAmount / potWinners.length);
      let remainder = potAmount % potWinners.length;
      for (const winner of potWinners) {
        const amount = share + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        winner.player.stack += amount;
        awards.set(winner.player.seat, (awards.get(winner.player.seat) || 0) + amount);
      }
      previousLevel = level;
    }

    this.winners = results
      .filter(result => awards.has(result.player.seat))
      .map(result => ({
        seat: result.player.seat,
        name: result.player.name,
        handName: result.name,
        amount: awards.get(result.player.seat)
      }));

    this.pot = 0;
    this.actionIndex = -1;

    return {
      ok: true,
      showdown: true,
      winners: this.winners,
      results
    };
  }

  endHand(winner) {
    winner.stack += this.pot;
    this.winners = [{
      seat: winner.seat,
      name: winner.name,
      handName: 'Uncontested',
      amount: this.pot
    }];
    this.pot = 0;
    this.street = 'showdown';
    this.actionIndex = -1;
    return { ok: true, winners: this.winners };
  }

  // Snapshot for UI / API
  getState(forSeat = null) {
    return {
      handNumber: this.handNumber,
      street: this.street,
      pot: this.pot,
      community: [...this.community],
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      actionSeat: this.actionIndex,
      dealerSeat: this.dealerIndex,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      winners: this.winners,
      players: this.players.map((p, i) => {
        if (!p) return { seat: i, empty: true };
        const viewerSeat = forSeat ?? this.heroSeat;
        const showCards = this.street === 'showdown' || viewerSeat === i;
        return {
          seat: i,
          id: p.id,
          name: p.name,
          stack: p.stack,
          bet: p.bet,
          totalBet: p.totalBet,
          folded: p.folded,
          allIn: p.allIn,
          isBot: p.isBot,
          hole: showCards ? [...p.hole] : (p.hole.length ? ['??', '??'] : []),
          isHero: i === viewerSeat
        };
      })
    };
  }
}

// Simple AI
function botDecide(table, seatIdx) {
  const p = table.players[seatIdx];
  if (!p) return { type: 'fold' };

  const legal = table.getLegalActions();
  const toCall = table.currentBet - p.bet;
  const potOdds = toCall / (table.pot + toCall + 0.001);

  // Rough hand strength
  let strength = 0.3;
  if (p.hole.length === 2) {
    const r1 = cardRank(p.hole[0]);
    const r2 = cardRank(p.hole[1]);
    const suited = cardSuit(p.hole[0]) === cardSuit(p.hole[1]);
    const high = Math.max(r1, r2);
    const low = Math.min(r1, r2);
    if (r1 === r2) strength = 0.55 + (high / 14) * 0.3;
    else {
      strength = (high / 14) * 0.4 + (low / 14) * 0.15;
      if (suited) strength += 0.08;
      if (high - low <= 2) strength += 0.05;
    }
  }

  // Adjust with community (very rough)
  if (table.community.length >= 3) {
    const ev = evaluateHand([...p.hole, ...table.community]);
    if (ev.score > 5e10) strength = 0.85;
    else if (ev.score > 3e10) strength = 0.7;
    else if (ev.score > 1e10) strength = 0.55;
    else strength = Math.max(strength, 0.25);
  }

  // Decision
  if (toCall === 0) {
    if (strength > 0.65 && Math.random() < 0.6) {
      const betSize = Math.min(p.stack, Math.floor(table.pot * (0.5 + Math.random() * 0.5)));
      if (betSize >= table.minRaise) return { type: 'bet', amount: betSize };
    }
    return { type: 'check' };
  }

  // Facing a bet
  if (strength < 0.35 && potOdds > 0.25) return { type: 'fold' };
  if (strength > 0.75) {
    // Raise or call
    if (Math.random() < 0.5 && p.stack > toCall * 2) {
      const raiseTo = Math.min(p.stack + p.bet, table.currentBet + Math.max(table.minRaise, Math.floor(table.pot * 0.7)));
      return { type: 'raise', amount: raiseTo };
    }
    return { type: 'call', amount: toCall };
  }
  if (strength > 0.45 || potOdds < 0.2) return { type: 'call', amount: Math.min(toCall, p.stack) };
  return { type: 'fold' };
}

// Export for browser
if (typeof window !== 'undefined') {
  window.PokerTable = PokerTable;
  window.botDecide = botDecide;
  window.evaluateHand = evaluateHand;
  window.cardRank = cardRank;
  window.RANKS = RANKS;
  window.SUITS = SUITS;
}

export { PokerTable, botDecide, evaluateHand, cardRank, RANKS, SUITS };
