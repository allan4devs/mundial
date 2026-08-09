'use client';
import { memo, Suspense, useCallback, useEffect, useRef, type PointerEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';
import { GameUI } from './GameUI/GameUI';
import { GameRuntimeProvider, useGameSceneContext } from '../context/GameContext';

export const GameCanvas = memo(function GameCanvas() {
  const {
    gameStatus,
    level,
    levelKey,
    playerPosRef,
    runtimeValue,
    otherPlayers,
  } = useGameSceneContext();
  const touchMovePointers = useRef(new Set<number>());

  const releaseTouchAdvance = useCallback((pointerId: number) => {
    touchMovePointers.current.delete(pointerId);
    if (touchMovePointers.current.size === 0) {
      runtimeValue.keys.current.right = false;
    }
  }, [runtimeValue.keys]);

  const handleTouchAdvanceStart = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (gameStatus !== 'playing' || event.pointerType === 'mouse') return;
    event.preventDefault();
    touchMovePointers.current.add(event.pointerId);
    runtimeValue.keys.current.right = true;
  }, [gameStatus, runtimeValue.keys]);

  const handleTouchAdvanceEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return;
    releaseTouchAdvance(event.pointerId);
  }, [releaseTouchAdvance]);

  useEffect(() => {
    if (gameStatus === 'playing') return;
    touchMovePointers.current.clear();
    runtimeValue.keys.current.right = false;
  }, [gameStatus, runtimeValue.keys]);

  useEffect(() => {
    return () => {
      runtimeValue.keys.current.right = false;
    };
  }, [runtimeValue.keys]);

  return (
    <div
      onPointerDown={handleTouchAdvanceStart}
      onPointerUp={handleTouchAdvanceEnd}
      onPointerCancel={handleTouchAdvanceEnd}
      onPointerLeave={handleTouchAdvanceEnd}
      style={{
        width: '100vw', height: '100vh',
        position: 'relative',
        background: '#060c10',
        overflow: 'hidden',
        touchAction: gameStatus === 'playing' ? 'none' : 'auto',
      }}
    >
      <Canvas
        camera={{
          position: [level.spawnPosition[0], level.spawnPosition[1] + 2.8, 10],
          fov: 62,
          near: 0.1,
          far: 100,
        }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        dpr={1}
      >
        <Suspense fallback={null}>
          <GameRuntimeProvider value={runtimeValue}>
            <Scene
              level={level}
              levelKey={levelKey}
              playerPosRef={playerPosRef}
              gameStatus={gameStatus}
              otherPlayers={otherPlayers}
            />
          </GameRuntimeProvider>
        </Suspense>
      </Canvas>

      <GameUI />
    </div>
  );
});
