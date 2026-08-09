'use client';
import { memo } from 'react';
import type { ActivePowerUps } from '../../types';

type PowerUpTimerBadgeProps = {
  active: boolean;
  background: string;
  border: string;
  color: string;
  label: string;
  remaining: number;
  shadow: string;
  total: number;
};

function timerPct(remaining: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, (remaining / total) * 100));
}

function PowerUpTimerBadge({
  active,
  background,
  border,
  color,
  label,
  remaining,
  shadow,
  total,
}: PowerUpTimerBadgeProps) {
  if (!active) return null;

  const pct = timerPct(remaining, total);
  const seconds = Math.max(0, Math.ceil(remaining));

  return (
    <div style={{
      minWidth: 170,
      overflow: 'hidden',
      borderRadius: 12,
      background,
      border,
      color,
      boxShadow: `0 0 18px ${shadow}`,
      textShadow: `0 0 8px ${shadow}`,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '5px 9px 4px',
        fontSize: 11,
        fontWeight: 900,
        letterSpacing: 1,
      }}>
        <span>{label}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{seconds}s</span>
      </div>
      <div style={{ height: 5, background: 'rgba(0,0,0,0.32)' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 12px ${shadow}`,
          transition: 'width 120ms linear',
        }} />
      </div>
    </div>
  );
}

export const PowerUpBadges = memo(function PowerUpBadges({ activePowerUps }: { activePowerUps: ActivePowerUps }) {
  if (!activePowerUps.ruby && !activePowerUps.sapphire) return null;

  return (
    <div style={{
      position: 'absolute',
      top: 14,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      maxWidth: 'calc(100vw - 24px)',
      pointerEvents: 'none',
    }}>
      <PowerUpTimerBadge
        active={activePowerUps.ruby}
        label="RUBI - INMUNE"
        remaining={activePowerUps.rubyRemaining}
        total={activePowerUps.rubyDuration}
        background="rgba(183,28,28,0.88)"
        border="1px solid #ff1744"
        color="#ffcdd2"
        shadow="rgba(255,23,68,0.75)"
      />
      <PowerUpTimerBadge
        active={activePowerUps.sapphire}
        label="ZAFIRO - DISPARAR"
        remaining={activePowerUps.sapphireRemaining}
        total={activePowerUps.sapphireDuration}
        background="rgba(13,71,161,0.88)"
        border="1px solid #1e88e5"
        color="#bbdefb"
        shadow="rgba(30,136,229,0.75)"
      />
    </div>
  );
});
