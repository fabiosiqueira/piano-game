import { useEffect, useRef, useState } from "react";
import type { Beatmap } from "../engine/types";
import type { GameState } from "../engine/game";
import { GameLoop } from "../game/gameLoop";
import { keyToLane } from "../game/input";
import type { IPiano } from "../audio/piano";

interface GameScreenProps {
  beatmap: Beatmap;
  fallSec: number;
  piano: IPiano;
  onEnd: (status: "won" | "lost", state: GameState) => void;
}

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const COUNTDOWN_START = 3;

export function GameScreen({
  beatmap,
  fallSec,
  piano,
  onEnd,
}: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown]);

  useEffect(() => {
    if (countdown > 0) return;
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const loop = new GameLoop({
      beatmap,
      fallSec,
      canvas,
      piano,
      onEnd: (result) => onEnd(result.status, result.state),
    });
    loopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [countdown, beatmap, fallSec, piano, onEnd]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const lane = keyToLane(e.key);
      if (lane !== undefined) loopRef.current?.pressLane(lane);
    };
    const up = (e: KeyboardEvent) => {
      const lane = keyToLane(e.key);
      if (lane !== undefined) loopRef.current?.releaseLane(lane);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  const togglePause = () => {
    const loop = loopRef.current;
    if (loop === null) return;
    if (paused) {
      loop.resume();
      setPaused(false);
    } else {
      loop.pause();
      setPaused(true);
    }
  };

  return (
    <div
      className="game-screen"
      style={{ position: "relative", width: CANVAS_WIDTH, margin: "0 auto" }}
    >
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      <div
        className="lanes-overlay"
        style={{ position: "absolute", inset: 0, display: "flex" }}
      >
        {[0, 1, 2, 3].map((lane) => (
          <div
            key={lane}
            style={{ flex: 1, touchAction: "none" }}
            onPointerDown={() => loopRef.current?.pressLane(lane)}
            onPointerUp={() => loopRef.current?.releaseLane(lane)}
          />
        ))}
      </div>
      <button
        type="button"
        className="pause-btn"
        onClick={togglePause}
        style={{
          position: "absolute",
          top: 8,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {paused ? "▶" : "❚❚"}
      </button>
      {countdown > 0 && (
        <div
          className="countdown"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            color: "#fff",
          }}
        >
          {countdown}
        </div>
      )}
    </div>
  );
}
