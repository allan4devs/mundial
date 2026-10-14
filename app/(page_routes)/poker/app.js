/**
 * Main application — wires UI + API + local engine loop
 */

const { PokerAPI, PokerSound, PokerPWA, UI } = window;
const api = new PokerAPI();
const authOverlay = document.getElementById('poker-auth');
const authForm = document.getElementById('poker-auth-form');
const authError = document.getElementById('poker-auth-error');
const logoutButton = document.getElementById('btn-poker-logout');
let autoBotTimer = null;

function showAuth(message = '') {
  if (authError) authError.textContent = message;
  const savedUsername = localStorage.getItem('poker:username');
  const usernameInput = document.getElementById('poker-username');
  if (usernameInput && savedUsername && !usernameInput.value) usernameInput.value = savedUsername;
  authOverlay?.classList.remove('hidden');
  document.getElementById('poker-username')?.focus();
}

function hideAuth() {
  authOverlay?.classList.add('hidden');
}

authForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = authForm.querySelector('button[type="submit"]');
  button.disabled = true;
  if (authError) authError.textContent = '';
  try {
    const username = authForm.username.value.trim();
    const response = await fetch('/api/poker/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: authForm.username.value }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Could not enter the table.');
    localStorage.setItem('poker:username', username);
    hideAuth();
    await init();
  } catch (error) {
    showAuth('Escribe un nombre de al menos 2 caracteres.');
  } finally {
    button.disabled = false;
  }
});

logoutButton?.addEventListener('click', async () => {
  api.disconnect();
  await fetch('/api/poker/auth', { method: 'DELETE' });
  window.location.reload();
});

let currentLegal = [];
let previousState = null;

function formatChips(value) {
  return new Intl.NumberFormat('en-US').format(value || 0);
}

function renderProfile() {
  document.getElementById('bankroll-display').textContent = api.profile ? formatChips(api.profile.balance) : '—';
}

async function init() {
  if (api.state) return;
  PokerSound.initButton('btn-sound');
  await api.createTable();
    if (logoutButton) logoutButton.hidden = false;
  renderProfile();

  api.onUpdate(async (state) => {
    const reachedShowdown = state.street === 'showdown' && previousState?.street !== 'showdown';
    const leftShowdown = state.street !== 'showdown' && previousState?.street === 'showdown';
    PokerSound.handleState(previousState, state);
    PokerPWA.handleState(previousState, state);
    previousState = state;
    UI.renderState(state);
    if (state.actionSeat >= 0 && !state.players[state.actionSeat]?.isHero) UI.showBotThinking(state);
    currentLegal = await api.getLegalActions();
    UI.renderActionBar(state, currentLegal);
    if (reachedShowdown && state.winners?.length) {
      const winnerText = state.winners.map(w => `${w.name}: +${formatChips(w.amount)} (${w.handName})`).join(' · ');
      UI.showOverlay('Winner!', winnerText);
      UI.animatePotToWinner(state.winners);
    }
    if (leftShowdown) UI.hideOverlay();
    const seated = state.heroSeat >= 0;
    document.getElementById('btn-new-game').disabled = seated;
    document.getElementById('btn-add-bot').disabled = !seated || state.players.filter(p => p?.isBot).length >= 5;
    document.getElementById('btn-settings').disabled = !seated;
  });

  api.onConnection((status) => {
    PokerSound.handleConnection(status);
    const indicator = document.getElementById('connection-status');
    indicator.dataset.status = status;
    indicator.textContent = status === 'connected'
      ? 'Live'
      : (status === 'reconnecting' ? 'Reconnecting…' : 'Connecting…');
  });

  // Wire buttons
  document.getElementById('btn-fold').onclick = () => act({ type: 'fold' });
  document.getElementById('btn-check').onclick = () => act({ type: 'check' });
  document.getElementById('btn-call').onclick = () => {
    const call = currentLegal.find(a => a.type === 'call');
    if (call) act({ type: 'call', amount: call.amount });
  };
  document.getElementById('btn-raise').onclick = () => {
    const val = +document.getElementById('bet-slider').value;
    const isBet = currentLegal.some(a => a.type === 'bet');
    act({ type: isBet ? 'bet' : 'raise', amount: val });
  };
  document.querySelectorAll('.quick-bet').forEach(button => {
    button.onclick = () => {
      const amount = Number(button.dataset.amount);
      if (Number.isFinite(amount)) {
        document.getElementById('bet-slider').value = String(amount);
        document.getElementById('bet-amount').textContent = String(amount);
      }
    };
  });
  document.getElementById('btn-allin').onclick = () => {
    const allin = currentLegal.find(a => a.type === 'allin');
    if (allin) act({ type: 'allin', amount: allin.amount });
  };
  window.addEventListener('poker:turn-timeout', async () => {
    const state = api.state;
    if (!state || state.heroSeat < 0 || state.actionSeat !== state.heroSeat || state.street === 'showdown') return;
    const automatic = currentLegal.find(action => action.type === 'check') || currentLegal.find(action => action.type === 'fold');
    if (!automatic) return;
    // A player who does not act within the turn limit is removed after the
    // forced check/fold, freeing the seat for the next player.
    const result = await act({ type: automatic.type });
    if (result?.ok) {
      try {
        await api.stand();
      } catch (error) {
        console.warn('Timed-out player could not stand up', error);
      }
    }
  });

  document.getElementById('btn-next-hand').onclick = UI.hideOverlay;
  document.getElementById('btn-new-game').onclick = () => {
    document.getElementById('settings-modal').classList.remove('hidden');
  };
  document.getElementById('btn-reset-game').onclick = async () => {
    const button = document.getElementById('btn-reset-game');
    button.disabled = true;
    button.textContent = 'Resetting…';
    try {
      api.disconnect();
      await api.resetTable();
      window.location.reload();
    } catch (error) {
      button.disabled = false;
      button.textContent = 'Reset game';
      UI.showOverlay('Could not reset game', error.message || 'Try again.');
    }
  };
  document.getElementById('btn-change-username').onclick = async () => {
    const current = api.profile?.name || localStorage.getItem('poker:username') || '';
    const username = window.prompt('Nuevo nombre de jugador', current)?.trim();
    if (!username || username === current) return;
    try {
      const response = await fetch('/api/poker/auth', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) throw new Error(payload.error || 'profile_update_failed');
      localStorage.setItem('poker:username', username);
      window.location.reload();
    } catch (error) {
      UI.showOverlay('Could not change name', error.message || 'Try again.');
    }
  };
  document.getElementById('btn-add-bot').onclick = async () => {
    try {
      await api.addBot();
      document.getElementById('btn-add-bot').textContent = 'Add Bot';
      await api.processUntilHeroOrEnd();
      if (!autoBotTimer) autoBotTimer = window.setInterval(() => {
        api.processUntilHeroOrEnd().catch((error) => console.warn('Auto poker stopped', error));
      }, 8500);
    } catch (error) {
      UI.showOverlay('Could not add bot', error.message || 'Try again.');
    }
  };
  document.getElementById('btn-settings').onclick = async () => {
    await PokerSound.unlock();
    try {
      const result = await api.stand();
      renderProfile();
      if (!result.ok) UI.showOverlay('Could not stand up', result.error || 'Try again.');
    } catch (error) {
      UI.showOverlay('Could not stand up', error.message || 'Try again.');
    }
  };
  document.getElementById('btn-close-settings').onclick = () => {
    document.getElementById('settings-modal').classList.add('hidden');
  };
  document.getElementById('btn-apply-settings').onclick = async () => {
    const buyIn = Math.floor(+document.getElementById('set-stack').value || 0);
    try {
      await api.sit(buyIn);
      renderProfile();
      document.getElementById('settings-modal').classList.add('hidden');
      PokerSound.play('chips');
    } catch (error) {
      UI.showOverlay(
        error.message === 'username_already_at_table' ? 'Username already at the table' : 'Could not sit down',
        error.message === 'username_already_at_table' ? 'That username is already seated. Use another username or wait for it to leave.' : 'Check your chip balance.'
      );
    }
  };

  // Friendly mode: enter the player automatically, add one bot, and start the
  // table without requiring a second hidden setup step.
  if ((api.state?.heroSeat ?? -1) < 0) {
    try {
      await api.sit(100000);
      await api.addBot();
      document.getElementById('btn-add-bot').textContent = 'Auto playing…';
      document.getElementById('btn-add-bot').disabled = true;
      await api.processUntilHeroOrEnd();
    if (!autoBotTimer) autoBotTimer = window.setInterval(() => {
      api.processUntilHeroOrEnd().catch((error) => console.warn('Auto poker stopped', error));
    }, 8500);
    } catch (error) {
      console.warn('Automatic poker setup failed', error);
      UI.showOverlay('Could not sit down', error.message || 'Check your chip balance or reset the table.');
    }
  }
}

async function act(action) {
  await PokerSound.unlock();
  const result = await api.takeAction(action);
  if (!result.ok) {
    console.warn(result.error);
    return result;
  }
  PokerSound.play(action.type === 'bet' ? 'raise' : action.type);
  await api.processUntilHeroOrEnd();
  return result;
}

// Boot
init().catch((error) => {
  console.error(error);
  if (error.status === 401) {
    showAuth('Escribe tu nombre para empezar a jugar.');
  } else {
    UI.showOverlay('Connection error', error.message === 'lobby_load_failed'
      ? 'The game server could not load the table. Check MongoDB and try again.'
      : 'The table could not connect to the game server. Try refreshing the page.');
  }
});

export {};
