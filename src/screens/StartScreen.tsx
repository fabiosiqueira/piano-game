import { DIFFICULTY } from "../engine/difficulty";
import type { DifficultyKey } from "../engine/difficulty";

interface StartScreenProps {
  onStart: (difficulty: DifficultyKey) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const keys = Object.keys(DIFFICULTY) as DifficultyKey[];
  return (
    <div className="start-screen">
      <h1>Piano Game</h1>
      <p>Música: Für Elise</p>
      <div className="difficulty-buttons">
        {keys.map((key) => (
          <button key={key} type="button" onClick={() => onStart(key)}>
            {DIFFICULTY[key].label}
          </button>
        ))}
      </div>
    </div>
  );
}
