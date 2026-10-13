/**
 * Main application — wires UI + API + local engine loop
 */

const { PokerAPI, PokerSound, PokerPWA, UI } = window;
const api = new PokerAPI();
const authOverlay = document.getElementById('poker-auth');
const authForm = document.getElementById('poker-auth-form');
const authError = document.getElementById('poker-auth-error');
const logoutButton = document.getElementById('btn-poker-logout');

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
    const response = await fetch('/api/poker/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: authForm.username.value, password: authForm.password.value }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Could not enter the table.');
    localStorage.setItem('poker:username', username);
    hideAuth();
    await init();
  } catch (error) {
    showAuth(error.message === 'invalid_credentials' ? 'That password does not match this username.' : 'Choose a username and password (8+ characters).');
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
    PokerSound.handleState(previousState, state);
    PokerPWA.handleState(previousState, state);
    previousState = state;
    UI.renderState(state);
    currentLegal = await api.getLegalActions();
    UI.renderActionBar(state, currentLegal);
    const seated = state.heroSeat >= 0;
    document.getElementById('btn-new-game').disabled = seated;
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
  document.getElementById('btn-allin').onclick = () => {
    const allin = currentLegal.find(a => a.type === 'allin');
    if (allin) act({ type: 'allin', amount: allin.amount });
  };

  document.getElementById('btn-next-hand').onclick = UI.hideOverlay;
  document.getElementById('btn-new-game').onclick = () => {
    document.getElementById('settings-modal').classList.remove('hidden');
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
      UI.showOverlay('Could not sit down', error.message || 'Check your chip balance.');
    }
  };
}

async function act(action) {
  await PokerSound.unlock();
  const result = await api.takeAction(action);
  if (!result.ok) {
    console.warn(result.error);
    return;
  }
  PokerSound.play(action.type === 'bet' ? 'raise' : action.type);
  await api.processUntilHeroOrEnd();
}

// Boot
init().catch((error) => {
  console.error(error);
  if (error.status === 401) {
    showAuth('Choose a username and password to start playing.');
  } else {
    if (error.status === 401) showAuth('Enter a username and password to play.');
    else UI.showOverlay('Connection error', 'The table could not connect to the game server. Check MongoDB and try again.');
  }
});

export {};
