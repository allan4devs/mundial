/** Persistent poker API client backed by MongoDB and WebSockets. */
class PokerAPI {
  constructor() {
    this.tableId = 'MAIN';
    this.gameId = null;
    this.profile = null;
    this.state = null;
    this.legalActions = [];
    this.listeners = new Set();
    this.connectionListeners = new Set();
    this.connectionStatus = 'connecting';
    this.socket = null;
    this.reconnectTimer = null;
    this.reconnectDelay = 1000;
    this.closedByClient = false;
    this.botRunInFlight = null;
  }

  onUpdate(cb) {
    this.listeners.add(cb);
    if (this.state) cb(this.state);
    return () => this.listeners.delete(cb);
  }

  onConnection(cb) {
    this.connectionListeners.add(cb);
    cb(this.connectionStatus);
    return () => this.connectionListeners.delete(cb);
  }

  _emitConnection(status) {
    this.connectionStatus = status;
    for (const cb of this.connectionListeners) cb(status);
  }

  _applyState(state) {
    if (!state || (this.state?.version ?? 0) > (state.version ?? 0)) return;
    this.state = state;
    this.legalActions = state.legalActions || [];
    for (const cb of this.listeners) cb(state);
  }

  async _request(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) {
      const error = new Error(payload.error || `Poker request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  async _authenticateSavedPlayer() {
    const username = window.localStorage?.getItem('poker:username')?.trim();
    if (!username) return false;
    const response = await fetch('/api/poker/auth', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.ok === false) return false;
    this.profile = payload.profile || this.profile;
    return true;
  }

  async createTable() {
    this.disconnect();
    this.closedByClient = false;
    let payload;
    try {
      payload = await this._request('/api/poker/lobby');
    } catch (error) {
      if (error.status !== 401 || !(await this._authenticateSavedPlayer())) throw error;
      payload = await this._request('/api/poker/lobby');
    }
    this.profile = payload.profile;
    this.gameId = payload.state?.gameId || this.gameId;
    this.state = null;
    this._applyState(payload.state);
    this.connect();
    return { ok: true, tableId: this.tableId, profile: this.profile };
  }

  connect() {
    if (!this.tableId || this.socket?.readyState === WebSocket.OPEN) return;
    clearTimeout(this.reconnectTimer);
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/api/poker/ws`;
    this._emitConnection('connecting');
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener('open', () => {
      this.reconnectDelay = 1000;
      this._emitConnection('connected');
    });
    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'state') this._applyState(message.state);
      } catch (error) {
        console.warn('Ignored malformed poker socket message', error);
      }
    });
    socket.addEventListener('close', () => {
      if (this.socket === socket) this.socket = null;
      if (this.closedByClient) return;
      this._emitConnection('reconnecting');
      this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30_000);
    });
    socket.addEventListener('error', () => socket.close());
  }

  disconnect() {
    this.closedByClient = true;
    clearTimeout(this.reconnectTimer);
    this.socket?.close(1000, 'Client reset');
    this.socket = null;
  }

  async startHand() {
    return { ok: true };
  }

  async getState() {
    if (this.state) return this.state;
    let payload;
    try {
      payload = await this._request('/api/poker/lobby');
    } catch (error) {
      if (error.status !== 401 || !(await this._authenticateSavedPlayer())) throw error;
      payload = await this._request('/api/poker/lobby');
    }
    this.profile = payload.profile;
    this.gameId = payload.state?.gameId || this.gameId;
    this._applyState(payload.state);
    return this.state;
  }

  async getLegalActions() {
    return this.legalActions;
  }

  async takeAction(action) {
    if (!this.tableId) return { ok: false, error: 'No table' };
    try {
      const payload = await this._request('/api/poker/action', {
        method: 'POST',
        body: JSON.stringify({ actionId: crypto.randomUUID(), action })
      });
      this._applyState(payload.state);
      return payload;
    } catch (error) {
      if (error.status === 409) {
        this.state = null;
        await this.getState();
      }
      return { ok: false, error: error.message };
    }
  }

  async processUntilHeroOrEnd() {
    if (this.botRunInFlight) return this.botRunInFlight;
    this.botRunInFlight = this._processUntilHeroOrEnd();
    try {
      return await this.botRunInFlight;
    } finally {
      this.botRunInFlight = null;
    }
  }

  async _processUntilHeroOrEnd() {
    // Let the showdown state render before the bot runner advances the table.
    // This keeps the winner overlay and final board readable without stopping
    // the automatic game loop.
    if (this.state?.street === 'showdown') {
      await new Promise((resolve) => window.setTimeout(resolve, 1800));
    }
    const botIsThinking = this.state?.actionSeat >= 0 && !this.state?.players?.[this.state.actionSeat]?.isHero;
    if (botIsThinking) {
      window.UI?.showBotThinking(this.state);
    }
    const payload = await this._request('/api/poker/bot', { method: 'POST', body: JSON.stringify({ mode: 'run', actionId: crypto.randomUUID() }) });
    this._applyState(payload.state);
    return payload;
  }

  async addBot() {
    const payload = await this._request('/api/poker/bot', { method: 'POST', body: JSON.stringify({ actionId: crypto.randomUUID() }) });
    this._applyState(payload.state);
    return payload;
  }

  async sit(buyIn) {
    const payload = await this._request('/api/poker/seat', { method: 'POST', body: JSON.stringify({ actionId: crypto.randomUUID(), buyIn }) });
    this._applyState(payload.state);
    await this.refreshProfile();
    return payload;
  }

  async stand() {
    const payload = await this._request('/api/poker/stand', { method: 'POST', body: JSON.stringify({ actionId: crypto.randomUUID() }) });
    this._applyState(payload.state);
    await this.refreshProfile();
    return payload;
  }

  async resetTable() {
    const payload = await this._request('/api/poker/reset', { method: 'POST', body: JSON.stringify({ actionId: crypto.randomUUID() }) });
    this._applyState(payload.state);
    await this.refreshProfile();
    return payload;
  }

  async refreshProfile() {
    const payload = await this._request('/api/poker/lobby');
    this.profile = payload.profile;
    this._applyState(payload.state);
    return this.profile;
  }
}

window.PokerAPI = PokerAPI;
export {};
