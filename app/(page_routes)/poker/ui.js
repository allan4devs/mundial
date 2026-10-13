/**
 * UI rendering & interactions
 */

const SUIT_SYMBOLS = { c: '♣', d: '♦', h: '♥', s: '♠' };
const RED_SUITS = new Set(['d', 'h']);
const TURN_SECONDS = 20;
let turnClock = { key: null, startedAt: 0 };
let lastWarningSecond = null;

function syncTurnClock(state) {
  const active = state.actionSeat >= 0 && state.street !== 'showdown' && state.players[state.actionSeat] && !state.players[state.actionSeat].folded;
  const key = active ? `${state.handNumber}:${state.street}:${state.actionSeat}` : null;
  if (key !== turnClock.key) {
    turnClock = { key, startedAt: active ? performance.now() : 0 };
    lastWarningSecond = null;
  }
}

function renderTurnTimer() {
  if (!turnClock.key) return;
  const elapsed = Math.max(0, (performance.now() - turnClock.startedAt) / 1000);
  const remaining = Math.max(0, TURN_SECONDS - elapsed);
  const seconds = Math.ceil(remaining);
  const progress = Math.max(0, Math.min(1, remaining / TURN_SECONDS));
  const activeSeat = turnClock.key.split(':').pop();
  const ring = document.querySelector(`.seat[data-seat="${activeSeat}"] .timer-ring`);
  if (!ring) return;

  ring.style.setProperty('--timer-progress', progress.toFixed(4));
  ring.querySelector('.timer-seconds').textContent = String(seconds);
  ring.classList.toggle('warning', remaining <= 8 && remaining > 0);
  ring.classList.toggle('expired', remaining <= 0);

  if (remaining <= 8 && seconds !== lastWarningSecond) {
    lastWarningSecond = seconds;
    window.PokerSound?.play(seconds > 0 ? 'timer' : 'timer-end');
  }
}

function startTimerLoop() {
  renderTurnTimer();
  window.requestAnimationFrame(startTimerLoop);
}

startTimerLoop();

function createCardEl(cardStr, small = false) {
  const el = document.createElement('div');
  el.className = 'card';
  if (!cardStr || cardStr === '??') {
    el.classList.add('back');
    return el;
  }
  const rank = cardStr[0] === 'T' ? '10' : cardStr[0];
  const suit = cardStr[1];
  el.classList.add(RED_SUITS.has(suit) ? 'red' : 'black');
  el.innerHTML = `<span class="rank">${rank}</span><span class="suit">${SUIT_SYMBOLS[suit]}</span>`;
  return el;
}

function renderSeats(state) {
  const container = document.getElementById('seats');
  syncTurnClock(state);
  container.innerHTML = '';

  state.players.forEach((p, i) => {
    const seat = document.createElement('div');
    seat.className = 'seat';
    seat.dataset.seat = i;

    if (p.empty) {
      seat.innerHTML = `<div class="seat-inner"><div class="seat-name">Empty</div></div>`;
      container.appendChild(seat);
      return;
    }

    if (p.isHero) seat.classList.add('hero');
    if (state.actionSeat === i) seat.classList.add('active');
    if (p.folded) seat.classList.add('folded');
    if (state.winners?.some(w => w.seat === i)) seat.classList.add('winner');

    const cardsHtml = document.createElement('div');
    cardsHtml.className = 'seat-cards';
    if (p.hole && p.hole.length) {
      p.hole.forEach(c => cardsHtml.appendChild(createCardEl(c, true)));
    }

    let status = '';
    if (p.folded) status = 'Folded';
    else if (p.allIn) status = 'All-In';
    else if (state.actionSeat === i) status = 'Acting...';

    const isActive = state.actionSeat === i && state.street !== 'showdown';
    seat.innerHTML = `
      <div class="seat-inner">
        ${isActive ? '<div class="timer-ring" aria-label="Turn timer"><span class="timer-seconds">20</span><small>s</small></div>' : ''}
        <div class="seat-name">${p.name}</div>
        <div class="seat-stack">${p.stack}</div>
        <div class="seat-status">${status}</div>
      </div>
    `;
    seat.querySelector('.seat-inner').appendChild(cardsHtml);

    if (p.bet > 0) {
      const betEl = document.createElement('div');
      betEl.className = 'seat-bet';
      betEl.textContent = p.bet;
      seat.appendChild(betEl);
    }

    // Dealer button
    if (state.dealerSeat === i) {
      const btn = document.createElement('div');
      btn.className = 'dealer-btn';
      btn.textContent = 'D';
      btn.style.top = '-10px';
      btn.style.right = '-10px';
      seat.appendChild(btn);
    }

    container.appendChild(seat);
  });
}

function renderCommunity(cards) {
  const slots = document.querySelectorAll('#community .card-slot');
  slots.forEach((slot, i) => {
    slot.innerHTML = '';
    if (cards[i]) {
      slot.appendChild(createCardEl(cards[i]));
    }
  });
}

function renderActionBar(state, legal) {
  const hero = state.heroSeat >= 0 ? state.players[state.heroSeat] : null;
  document.getElementById('hero-stack').textContent = hero ? hero.stack : 'Watching';

  const toCall = state.currentBet - (hero?.bet || 0);
  document.getElementById('to-call').textContent = toCall > 0 ? `To call: ${toCall}` : 'Your turn';

  const btnFold = document.getElementById('btn-fold');
  const btnCheck = document.getElementById('btn-check');
  const btnCall = document.getElementById('btn-call');
  const btnRaise = document.getElementById('btn-raise');
  const btnAllin = document.getElementById('btn-allin');
  const slider = document.getElementById('bet-slider');
  const betAmount = document.getElementById('bet-amount');

  const isHeroTurn = state.heroSeat >= 0 && state.actionSeat === state.heroSeat && state.street !== 'showdown';

  btnFold.disabled = !isHeroTurn || !legal.some(a => a.type === 'fold');
  btnCheck.disabled = !isHeroTurn || !legal.some(a => a.type === 'check');
  btnCall.disabled = !isHeroTurn || !legal.some(a => a.type === 'call');
  btnRaise.disabled = !isHeroTurn || !(legal.some(a => a.type === 'raise') || legal.some(a => a.type === 'bet'));
  btnAllin.disabled = !isHeroTurn || !legal.some(a => a.type === 'allin');
  slider.disabled = !isHeroTurn || btnRaise.disabled;

  // Update button labels
  btnCall.textContent = toCall > 0 ? `Call ${toCall}` : 'Call';
  btnCheck.style.display = toCall === 0 ? '' : 'none';
  btnCall.style.display = toCall > 0 ? '' : 'none';

  const raiseAction = legal.find(a => a.type === 'raise') || legal.find(a => a.type === 'bet');
  if (raiseAction && hero) {
    const min = raiseAction.min || state.minRaise;
    const max = raiseAction.max || hero.stack + (hero.bet || 0);
    slider.min = min;
    slider.max = max;
    slider.value = Math.min(Math.max(min, +slider.value || min), max);
    betAmount.textContent = slider.value;
    btnRaise.textContent = (toCall === 0 ? 'Bet ' : 'Raise to ') + slider.value;
  } else {
    betAmount.textContent = '0';
  }

  slider.oninput = () => {
    betAmount.textContent = slider.value;
    btnRaise.textContent = (toCall === 0 ? 'Bet ' : 'Raise to ') + slider.value;
  };
}

function renderState(state) {
  document.getElementById('hand-count').textContent = state.handNumber;
  document.getElementById('blinds-display').textContent = `${state.smallBlind} / ${state.bigBlind}`;
  document.getElementById('pot-display').textContent = state.pot;
  document.getElementById('center-pot').textContent = state.pot;
  document.getElementById('street-label').textContent = (state.street || '').toUpperCase();

  renderSeats(state);
  renderCommunity(state.community || []);
}

function showOverlay(title, msg) {
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-msg').textContent = msg;
  document.getElementById('overlay').classList.remove('hidden');
}

function hideOverlay() {
  document.getElementById('overlay').classList.add('hidden');
}

window.UI = {
  renderState,
  renderActionBar,
  showOverlay,
  hideOverlay,
  createCardEl
};

export {};
