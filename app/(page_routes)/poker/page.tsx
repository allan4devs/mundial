"use client";

import { useEffect, useRef, useState } from "react";
import "./styles.css";

export default function PokerPage() {
  const loadedRef = useRef(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    async function loadGame() {
      try {
        await import("./poker-engine.js");
        await import("./api.js");
        await import("./ui.js");
        await import("./sound.js");
        await import("./pwa.js");
        await import("./app.js");
      } catch (error) {
        console.error("Unable to start the poker table", error);
        setLoadError(true);
      }
    }

    void loadGame();
  }, []);

  return (
    <div id="poker-app">
      <header className="top-bar">
        <div className="brand">
          <span className="logo" aria-hidden="true">♠</span>
          <span className="title">POKER TABLE</span>
        </div>
        <div className="stats" aria-label="Table status">
          <div className="stat"><span className="label">Hand</span><span id="hand-count">1</span></div>
          <div className="stat"><span className="label">Blinds</span><span id="blinds-display">5K / 10K</span></div>
          <div className="stat"><span className="label">Pot</span><span id="pot-display">0</span></div>
          <div className="stat bankroll-stat"><span className="label">Bank</span><span id="bankroll-display">—</span></div>
        </div>
        <div className="controls">
          <span className="connection-status" id="connection-status" data-status="connecting">Connecting…</span>
          <button id="btn-install" className="btn btn-icon pwa-control hidden" type="button" aria-label="Install Poker Table" title="Install app">↓</button>
          <button id="btn-notifications" className="btn btn-icon" type="button" aria-label="Enable turn notifications" aria-pressed="false" title="Enable notifications">🔕</button>
          <button id="btn-sound" className="btn btn-icon" type="button" aria-label="Mute poker sounds" aria-pressed="false">🔊</button>
          <button id="btn-new-game" className="btn btn-secondary" type="button">Sit Down</button>
          <button id="btn-poker-logout" className="btn btn-ghost" type="button" hidden>Log out</button>
          <button id="btn-settings" className="btn btn-ghost" type="button" disabled>Stand Up</button>
        </div>
      </header>

      <main className="table-container">
        <div className="felt" id="felt">
          <div className="community" id="community" aria-label="Community cards">
            {[0, 1, 2, 3, 4].map((index) => (
              <div className="card-slot" data-idx={index} key={index} />
            ))}
          </div>
          <div className="center-pot">
            <div className="pot-amount" id="center-pot">0</div>
            <div className="street-label" id="street-label">PREFLOP</div>
          </div>
          <div className="seats" id="seats" aria-live="polite" />
        </div>
      </main>

      <footer className="action-bar" id="action-bar">
        <div className="player-info">
          <div className="stack" id="hero-stack">Watching</div>
          <div className="to-call" id="to-call">Choose your chips to play</div>
        </div>
        <div className="actions">
          <button className="btn btn-fold" id="btn-fold" type="button" disabled>Fold</button>
          <button className="btn btn-check" id="btn-check" type="button" disabled>Check</button>
          <button className="btn btn-call" id="btn-call" type="button" disabled>Call</button>
          <div className="raise-group">
            <input aria-label="Bet amount" type="range" id="bet-slider" min="0" max="1000" defaultValue="0" disabled />
            <div className="raise-buttons">
              <button className="btn btn-raise" id="btn-raise" type="button" disabled>Raise</button>
              <button className="btn btn-allin" id="btn-allin" type="button" disabled>All-In</button>
            </div>
          </div>
        </div>
        <div className="bet-amount" id="bet-amount">0</div>
      </footer>

      <div className="poker-auth hidden" id="poker-auth" role="dialog" aria-modal="true" aria-labelledby="poker-auth-title">
        <form className="poker-auth-card" id="poker-auth-form">
          <div className="poker-auth-mark" aria-hidden="true">♠</div>
          <h2 id="poker-auth-title">Choose your player</h2>
          <p className="poker-auth-copy">Only a username and password. We’ll remember you on this browser and take you straight to the table.</p>
          <label>Username<input id="poker-username" name="username" autoComplete="username" minLength={3} maxLength={24} required /></label>
          <label>Password<input id="poker-password" name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <p className="poker-auth-error" id="poker-auth-error" role="alert" />
          <button className="btn btn-primary" type="submit">Start playing</button>
        </form>
      </div>

      <div className="overlay hidden" id="overlay" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
        <div className="overlay-content">
          <h2 id="overlay-title">Winner!</h2>
          <p id="overlay-msg" />
          <button className="btn btn-primary" id="btn-next-hand" type="button">Next Hand</button>
        </div>
      </div>

      <div className="modal hidden" id="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="modal-content">
          <h3 id="settings-title">Sit at the table</h3>
          <p className="cashier-copy">Choose how many chips to bring. Blinds are always 5,000 / 10,000.</p>
          <label>Buy-in <input type="number" id="set-stack" defaultValue="100000" min="100000" step="10000" /></label>
          <div className="modal-actions">
            <button className="btn btn-primary" id="btn-apply-settings" type="button">Take a Seat</button>
            <button className="btn btn-ghost" id="btn-close-settings" type="button">Close</button>
          </div>
        </div>
      </div>

      {loadError ? (
        <div className="load-error" role="alert">The poker table could not start. Refresh the page to try again.</div>
      ) : null}
    </div>
  );
}
