/** Poker-only PWA installation and local turn notifications. */

const installButton = document.getElementById('btn-install');
const notificationButton = document.getElementById('btn-notifications');
let installPrompt = null;
let notifiedTurn = null;

function notificationSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

function renderNotificationButton() {
  if (!notificationButton) return;
  if (!notificationSupported()) {
    notificationButton.hidden = true;
    return;
  }
  const enabled = Notification.permission === 'granted';
  const denied = Notification.permission === 'denied';
  notificationButton.hidden = false;
  notificationButton.setAttribute('aria-pressed', String(enabled));
  notificationButton.textContent = enabled ? '🔔' : '🔕';
  notificationButton.title = enabled
    ? 'Turn notifications enabled'
    : (denied ? 'Notifications blocked in browser settings' : 'Enable turn notifications');
  notificationButton.setAttribute('aria-label', notificationButton.title);
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/poker-sw.js', { scope: '/poker' });
  } catch (error) {
    console.warn('Poker service worker registration failed', error);
    return null;
  }
}

async function showNotification(title, body, tag) {
  if (!notificationSupported() || Notification.permission !== 'granted') return;
  const registration = await navigator.serviceWorker.ready;
  await registration.showNotification(title, {
    body,
    tag,
    icon: '/poker/icon.svg',
    badge: '/poker/icon.svg',
    renotify: true,
  });
}

notificationButton?.addEventListener('click', async () => {
  if (!notificationSupported()) return;
  if (Notification.permission === 'default') await Notification.requestPermission();
  renderNotificationButton();
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installPrompt = event;
  installButton?.classList.remove('hidden');
});

installButton?.addEventListener('click', async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  installButton.classList.add('hidden');
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  installButton?.classList.add('hidden');
});

void registerServiceWorker();
renderNotificationButton();

window.PokerPWA = {
  handleState(previousState, state) {
    if (document.visibilityState === 'visible' || state.heroSeat < 0) return;
    const isHeroTurn = state.actionSeat === state.heroSeat && state.street !== 'showdown';
    const wasHeroTurn = previousState?.actionSeat === previousState?.heroSeat;
    if (!isHeroTurn || wasHeroTurn) return;

    const key = `${state.handNumber}:${state.street}`;
    if (notifiedTurn === key) return;
    notifiedTurn = key;
    void showNotification('Your turn', 'The poker table is waiting for your move.', `poker-turn-${key}`);
  },
};

export {};
