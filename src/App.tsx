import { useCallback, useMemo, useState } from "react";
import { StartScreen } from "./screens/StartScreen";
import { GameScreen } from "./screens/GameScreen";
import { ResultScreen } from "./screens/ResultScreen";
import { DIFFICULTY } from "./engine/difficulty";
import type { DifficultyKey } from "./engine/difficulty";
import { generateBeatmap } from "./engine/beatmap";
import type { Beatmap } from "./engine/types";
import type { GameState } from "./engine/game";
import { parseMidi } from "./midi/parseMidi";
import { Piano } from "./audio/piano";

const SONG_URL = "/songs/fur-elise.mid";

type Phase =
  | { name: "start" }
  | { name: "loading" }
  | { name: "playing"; beatmap: Beatmap; difficulty: DifficultyKey }
  | {
      name: "result";
      status: "won" | "lost";
      state: GameState;
      beatmap: Beatmap;
      difficulty: DifficultyKey;
    };

function App() {
  const [phase, setPhase] = useState<Phase>({ name: "start" });
  const [error, setError] = useState<string | null>(null);
  const piano = useMemo(() => new Piano(), []);

  const startGame = useCallback(
    async (difficulty: DifficultyKey) => {
      setPhase({ name: "loading" });
      setError(null);
      try {
        const response = await fetch(SONG_URL);
        if (!response.ok) {
          throw new Error(`Falha ao carregar a música (${response.status})`);
        }
        const notes = parseMidi(await response.arrayBuffer());
        const beatmap = generateBeatmap(notes);
        await piano.load();
        setPhase({ name: "playing", beatmap, difficulty });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao iniciar o jogo");
        setPhase({ name: "start" });
      }
    },
    [piano],
  );

  if (phase.name === "start") {
    return (
      <>
        {error !== null && <p role="alert">{error}</p>}
        <StartScreen onStart={startGame} />
      </>
    );
  }

  if (phase.name === "loading") {
    return <p>Carregando…</p>;
  }

  if (phase.name === "playing") {
    return (
      <GameScreen
        beatmap={phase.beatmap}
        fallSec={DIFFICULTY[phase.difficulty].fallSec}
        piano={piano}
        onEnd={(status, state) =>
          setPhase({
            name: "result",
            status,
            state,
            beatmap: phase.beatmap,
            difficulty: phase.difficulty,
          })
        }
      />
    );
  }

  return (
    <ResultScreen
      status={phase.status}
      score={phase.state.score}
      maxCombo={phase.state.maxCombo}
      hitCount={phase.state.hitCount}
      totalTiles={phase.state.totalTiles}
      onReplay={() =>
        setPhase({
          name: "playing",
          beatmap: phase.beatmap,
          difficulty: phase.difficulty,
        })
      }
      onBack={() => setPhase({ name: "start" })}
    />
  );
}

export default App;
