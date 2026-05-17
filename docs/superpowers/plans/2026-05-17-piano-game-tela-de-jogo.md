# Piano Game — Plano 2: Tela de Jogo — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a Tela de Jogo jogável de ponta a ponta no navegador — blocos MIDI caindo, mecânica de pressionar-e-segurar, áudio de piano, e tela de Resultado.

**Architecture:** Engine TypeScript pura (sem React) redesenhada para press/release; módulos isolados `midi/`, `audio/`, `render/`, `game/` (loop); telas React (`StartScreen` provisória, `GameScreen`, `ResultScreen`). Relógio único do Canvas comanda tudo; áudio dispara em toda pressão, desacoplado da pontuação.

**Tech Stack:** React 19, TypeScript, Vite, Canvas 2D, `@tonejs/midi`, `Tone.js`, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-17-piano-game-tela-de-jogo-design.md`

---

## Estrutura de arquivos

```
src/
  engine/   types.ts (mod), beatmap.ts (mod), score.ts (mod), game.ts (mod),
            difficulty.ts (novo), index.ts (novo barrel)
  midi/     parseMidi.ts (novo)
  render/   geometry.ts (novo), renderer.ts (novo)
  audio/    piano.ts (novo)
  game/     input.ts (novo), gameLoop.ts (novo)
  screens/  StartScreen.tsx, GameScreen.tsx, ResultScreen.tsx (novos)
  test/     setup.ts (novo)
  App.tsx (mod)
public/
  songs/fur-elise.mid (asset)
  samples/piano/*.mp3 (assets)
vite.config.ts (mod)
```

Convenção de imports: imports relativos **sem extensão** (`moduleResolution: "bundler"`, segue o código existente).

---

### Task 1: Setup — dependências e config do Vitest

**Files:**
- Modify: `vite.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Instalar dependências**

```bash
npm install tone @tonejs/midi
npm install -D jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Criar o setup de testes**

`src/test/setup.ts`:
```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 3: Configurar o Vitest em `vite.config.ts`**

Substituir todo o conteúdo de `vite.config.ts` por:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 4: Rodar a suíte existente**

Run: `npm test`
Expected: PASS — os 25 testes do Plano 1 continuam passando, agora sob ambiente jsdom.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/test/setup.ts
git commit -m "chore: deps de áudio/MIDI/RTL e config do Vitest"
```

---

### Task 2: Config de dificuldade

**Files:**
- Create: `src/engine/difficulty.ts`
- Test: `src/engine/difficulty.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

`src/engine/difficulty.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { DIFFICULTY } from "./difficulty";
import type { DifficultyKey } from "./difficulty";

describe("DIFFICULTY", () => {
  it("expõe os três níveis", () => {
    const keys: DifficultyKey[] = ["lento", "medio", "rapido"];
    expect(Object.keys(DIFFICULTY).sort()).toEqual([...keys].sort());
  });

  it("cada nível tem label e fallSec positivo", () => {
    for (const key of Object.keys(DIFFICULTY) as DifficultyKey[]) {
      expect(typeof DIFFICULTY[key].label).toBe("string");
      expect(DIFFICULTY[key].fallSec).toBeGreaterThan(0);
    }
  });

  it("lento é mais lento que rápido", () => {
    expect(DIFFICULTY.lento.fallSec).toBeGreaterThan(DIFFICULTY.rapido.fallSec);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- difficulty`
Expected: FAIL — `Cannot find module './difficulty'`.

- [ ] **Step 3: Implementar**

`src/engine/difficulty.ts`:
```ts
/**
 * Tempo de queda (segundos) de cada nível. Único ponto a ajustar para
 * mudar a velocidade do jogo — não afeta a beatmap.
 */
export const DIFFICULTY = {
  lento: { label: "Lento", fallSec: 3.4 },
  medio: { label: "Médio", fallSec: 2.3 },
  rapido: { label: "Rápido", fallSec: 1.5 },
} as const;

export type DifficultyKey = keyof typeof DIFFICULTY;
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- difficulty`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/difficulty.ts src/engine/difficulty.test.ts
git commit -m "feat: config de dificuldade (Lento/Médio/Rápido)"
```

---

### Task 2.5: `Tile` ganha `durationSec` e `Beatmap.tiles` vira readonly

**Files:**
- Modify: `src/engine/types.ts`
- Modify: `src/engine/types.test.ts`

- [ ] **Step 1: Atualizar o teste de tipos**

Substituir `src/engine/types.test.ts` por:
```ts
import { describe, it, expect } from "vitest";
import { LANE_COUNT } from "./types";
import type { MidiNote, Tile, Beatmap } from "./types";

describe("types", () => {
  it("expõe LANE_COUNT igual a 4", () => {
    expect(LANE_COUNT).toBe(4);
  });

  it("os tipos compõem uma beatmap válida", () => {
    const note: MidiNote = { time: 0, midi: 60, duration: 0.5 };
    const tile: Tile = {
      id: 0,
      time: note.time,
      lane: 0,
      midi: note.midi,
      durationSec: note.duration,
    };
    const beatmap: Beatmap = { tiles: [tile], durationSec: 0.5 };
    expect(beatmap.tiles[0].durationSec).toBe(0.5);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- types`
Expected: FAIL — `durationSec` não existe em `Tile` (erro de tipo no `tsc`/teste).

- [ ] **Step 3: Atualizar `src/engine/types.ts`**

No `interface Tile`, adicionar o campo `durationSec` após `midi`:
```ts
  /** Pitch MIDI, usado depois para tocar o som de piano. */
  midi: number;
  /** Duração do bloco, em segundos (vinda da nota MIDI). */
  durationSec: number;
}
```

Em `interface Beatmap`, trocar `tiles: Tile[]` por:
```ts
  tiles: readonly Tile[];
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- types`
Expected: PASS. Outros arquivos podem falhar a compilação (beatmap/game) — corrigidos nas próximas tasks.

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/types.test.ts
git commit -m "feat: Tile com durationSec e Beatmap.tiles readonly"
```

---

### Task 3: Beatmap com durações e acordes (máx. 2 simultâneos)

**Files:**
- Modify: `src/engine/beatmap.ts`
- Modify: `src/engine/beatmap.test.ts`

- [ ] **Step 1: Reescrever o teste**

Substituir `src/engine/beatmap.test.ts` por:
```ts
import { describe, it, expect } from "vitest";
import { generateBeatmap } from "./beatmap";
import type { MidiNote } from "./types";

const note = (time: number, midi = 60, duration = 0.25): MidiNote => ({
  time,
  midi,
  duration,
});

describe("generateBeatmap", () => {
  it("beatmap vazia para lista vazia", () => {
    const bm = generateBeatmap([]);
    expect(bm.tiles).toEqual([]);
    expect(bm.durationSec).toBe(0);
  });

  it("distribui as 5 primeiras notas em colunas rotativas 0,1,2,3,0", () => {
    const notes = [note(0), note(1), note(2), note(3), note(4)];
    const lanes = generateBeatmap(notes).tiles.map((t) => t.lane);
    expect(lanes).toEqual([0, 1, 2, 3, 0]);
  });

  it("ordena por tempo e atribui ids sequenciais", () => {
    const notes = [note(2), note(0), note(1)];
    const tiles = generateBeatmap(notes).tiles;
    expect(tiles.map((t) => t.time)).toEqual([0, 1, 2]);
    expect(tiles.map((t) => t.id)).toEqual([0, 1, 2]);
  });

  it("preserva pitch e duração e calcula a duração total", () => {
    const bm = generateBeatmap([note(0, 64, 0.5), note(3, 67, 0.25)]);
    expect(bm.tiles[1].midi).toBe(67);
    expect(bm.tiles[0].durationSec).toBe(0.5);
    expect(bm.durationSec).toBeCloseTo(3.25);
  });

  it("não repete a mesma coluna em duas notas consecutivas", () => {
    const notes = Array.from({ length: 20 }, (_, i) => note(i * 0.5));
    const lanes = generateBeatmap(notes).tiles.map((t) => t.lane);
    for (let i = 1; i < lanes.length; i++) {
      expect(lanes[i]).not.toBe(lanes[i - 1]);
    }
  });

  it("limita notas simultâneas a 2 colunas distintas", () => {
    const notes = [note(0), note(0), note(0), note(0)];
    const tiles = generateBeatmap(notes).tiles;
    expect(tiles).toHaveLength(2);
    expect(new Set(tiles.map((t) => t.lane)).size).toBe(2);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- beatmap`
Expected: FAIL — `limita notas simultâneas a 2 colunas distintas` falha (algoritmo atual gera 4 tiles).

- [ ] **Step 3: Reescrever `src/engine/beatmap.ts`**

```ts
import { LANE_COUNT } from "./types";
import type { MidiNote, Tile, Beatmap } from "./types";

/** Notas dentro desta janela (s) contam como simultâneas (acorde). */
const SIMULTANEITY_EPS = 0.01;
/** Máximo de blocos simultâneos — duas mãos da criança. */
const MAX_SIMULTANEOUS = 2;

/**
 * Gera uma beatmap a partir de notas MIDI.
 * Notas simultâneas viram um acorde de até 2 colunas distintas; o restante
 * é descartado. Notas não-simultâneas vão para a coluna usada há mais tempo.
 */
export function generateBeatmap(notes: MidiNote[]): Beatmap {
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const lastUsed: number[] = new Array(LANE_COUNT).fill(-Infinity);
  const tiles: Tile[] = [];
  let id = 0;
  let i = 0;

  while (i < sorted.length) {
    const groupTime = sorted[i].time;
    const group: MidiNote[] = [];
    while (i < sorted.length && sorted[i].time - groupTime <= SIMULTANEITY_EPS) {
      group.push(sorted[i]);
      i++;
    }
    const chosen = group.slice(0, MAX_SIMULTANEOUS);
    const usedLanes = new Set<number>();
    for (const noteOfGroup of chosen) {
      let lane = -1;
      for (let l = 0; l < LANE_COUNT; l++) {
        if (usedLanes.has(l)) continue;
        if (lane === -1 || lastUsed[l] < lastUsed[lane]) lane = l;
      }
      usedLanes.add(lane);
      lastUsed[lane] = noteOfGroup.time;
      tiles.push({
        id: id++,
        time: noteOfGroup.time,
        lane,
        midi: noteOfGroup.midi,
        durationSec: noteOfGroup.duration,
      });
    }
  }

  const last = sorted[sorted.length - 1];
  const durationSec = last ? last.time + last.duration : 0;
  return { tiles, durationSec };
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- beatmap`
Expected: PASS (6 testes).

- [ ] **Step 5: Commit**

```bash
git add src/engine/beatmap.ts src/engine/beatmap.test.ts
git commit -m "feat: beatmap com durações e acordes limitados a 2 colunas"
```

---

### Task 4: Score — bônus de conclusão de nota longa

**Files:**
- Modify: `src/engine/score.ts`
- Modify: `src/engine/score.test.ts`

- [ ] **Step 1: Acrescentar o teste do bônus**

Acrescentar ao final de `src/engine/score.test.ts` (antes da última linha), e ajustar o import da primeira linha:
```ts
import { comboMultiplier, pointsFor, LONG_NOTE_BONUS } from "./score";
```
Bloco novo no fim do arquivo:
```ts
describe("LONG_NOTE_BONUS", () => {
  it("é um valor positivo de bônus", () => {
    expect(LONG_NOTE_BONUS).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- score`
Expected: FAIL — `LONG_NOTE_BONUS` não exportado.

- [ ] **Step 3: Implementar**

Acrescentar ao final de `src/engine/score.ts`:
```ts
/** Bônus por segurar uma nota longa até o fim. */
export const LONG_NOTE_BONUS = 50;
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- score`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/score.ts src/engine/score.test.ts
git commit -m "feat: bônus de conclusão de nota longa"
```

---

### Task 5: Engine — redesenho para press/release

**Files:**
- Modify: `src/engine/game.ts`
- Modify: `src/engine/game.test.ts`

- [ ] **Step 1: Reescrever o teste**

Substituir `src/engine/game.test.ts` por:
```ts
import { describe, it, expect } from "vitest";
import { Game, PERFECT_WINDOW, GOOD_WINDOW } from "./game";
import type { Beatmap } from "./types";

const beatmap = (...times: number[]): Beatmap => ({
  tiles: times.map((time, id) => ({
    id,
    time,
    lane: id % 4,
    midi: 60,
    durationSec: 0.25,
  })),
  durationSec: Math.max(0, ...times) + 1,
});

describe("Game.press", () => {
  it("pressão dentro da janela perfeita conta perfect", () => {
    const g = new Game(beatmap(1.0));
    expect(g.press(0, 1.0 + PERFECT_WINDOW / 2)).toBe("perfect");
    expect(g.state.combo).toBe(1);
    expect(g.state.score).toBe(100);
  });

  it("pressão fora da perfeita mas dentro da boa conta good", () => {
    const g = new Game(beatmap(1.0));
    expect(g.press(0, 1.0 + (PERFECT_WINDOW + GOOD_WINDOW) / 2)).toBe("good");
    expect(g.state.score).toBe(50);
  });

  it("pressão sem bloco na janela conta miss e perde o jogo", () => {
    const g = new Game(beatmap(5.0));
    expect(g.press(0, 1.0)).toBe("miss");
    expect(g.state.combo).toBe(0);
    expect(g.state.status).toBe("lost");
  });

  it("pressão na coluna errada não casa com o bloco", () => {
    const g = new Game(beatmap(1.0));
    expect(g.press(1, 1.0)).toBe("miss");
    expect(g.state.status).toBe("lost");
  });

  it("não casa o mesmo bloco duas vezes", () => {
    const g = new Game({
      tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 0.25 }],
      durationSec: 2,
    });
    expect(g.press(0, 1.0)).toBe("perfect");
    expect(g.press(0, 1.0)).toBe("miss");
  });

  it("acumula combo e maxCombo", () => {
    const g = new Game(beatmap(1.0, 2.0));
    g.press(0, 1.0);
    g.press(1, 2.0);
    expect(g.state.combo).toBe(2);
    expect(g.state.maxCombo).toBe(2);
    expect(g.state.hitCount).toBe(2);
  });

  it("ignora pressões após o fim de jogo", () => {
    const g = new Game(beatmap(5.0));
    g.press(0, 1.0);
    expect(g.press(0, 5.0)).toBe("miss");
    expect(g.state.score).toBe(0);
  });
});

describe("Game.peekTarget", () => {
  it("retorna o bloco não-tocado mais próximo da coluna", () => {
    const g = new Game(beatmap(1.0, 2.0));
    expect(g.peekTarget(0, 1.1)?.id).toBe(0);
  });

  it("retorna undefined quando a coluna não tem blocos", () => {
    const g = new Game(beatmap(1.0));
    expect(g.peekTarget(3, 1.0)).toBeUndefined();
  });
});

describe("Game.release", () => {
  it("bônus ao segurar a nota longa até o fim", () => {
    const g = new Game({
      tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 1.0 }],
      durationSec: 3,
    });
    g.press(0, 1.0);
    const afterPress = g.state.score;
    g.release(0, 2.0);
    expect(g.state.score).toBeGreaterThan(afterPress);
  });

  it("soltar cedo não dá bônus e não perde o jogo", () => {
    const g = new Game({
      tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 1.0 }],
      durationSec: 3,
    });
    g.press(0, 1.0);
    const afterPress = g.state.score;
    g.release(0, 1.1);
    expect(g.state.score).toBe(afterPress);
    expect(g.state.status).toBe("playing");
  });

  it("release sem pressão prévia é inofensivo", () => {
    const g = new Game(beatmap(1.0));
    expect(() => g.release(0, 1.0)).not.toThrow();
  });
});

describe("Game.update", () => {
  it("perde o jogo quando um bloco passa sem ser tocado", () => {
    const g = new Game(beatmap(1.0));
    g.update(1.0 + GOOD_WINDOW + 0.01);
    expect(g.state.status).toBe("lost");
  });

  it("não encerra enquanto o bloco ainda está na janela", () => {
    const g = new Game(beatmap(1.0));
    g.update(1.0);
    expect(g.state.status).toBe("playing");
  });

  it("vence quando todos os blocos foram tocados", () => {
    const g = new Game(beatmap(1.0));
    g.press(0, 1.0);
    g.update(1.0);
    expect(g.state.status).toBe("won");
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- game`
Expected: FAIL — `press`/`release`/`peekTarget` não existem; `status` não tem `won`/`lost`.

- [ ] **Step 3: Reescrever `src/engine/game.ts`**

```ts
import type { Beatmap, Tile } from "./types";
import { pointsFor, LONG_NOTE_BONUS } from "./score";
import type { HitQuality } from "./score";

/** Tolerância (s) para uma pressão ser `perfect`. */
export const PERFECT_WINDOW = 0.08;
/** Tolerância (s) para uma pressão ser `good`. */
export const GOOD_WINDOW = 0.18;

export type GameStatus = "playing" | "won" | "lost";

export interface GameState {
  readonly score: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly status: GameStatus;
  /** Quantidade de blocos acertados. */
  readonly hitCount: number;
  /** Total de blocos da beatmap. */
  readonly totalTiles: number;
}

type MutableGameState = { -readonly [K in keyof GameState]: GameState[K] };

/** Estado e regras de uma partida. Independente de UI. */
export class Game {
  private readonly tiles: readonly Tile[];
  private readonly hit = new Set<number>();
  /** Bloco longo atualmente segurado, por coluna. */
  private readonly held = new Map<number, Tile>();
  private readonly mutableState: MutableGameState;

  get state(): GameState {
    return this.mutableState;
  }

  constructor(beatmap: Beatmap) {
    this.tiles = [...beatmap.tiles].sort((a, b) => a.time - b.time);
    this.mutableState = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      status: "playing",
      hitCount: 0,
      totalTiles: this.tiles.length,
    };
  }

  /** Bloco não-tocado mais próximo de `nowSec` naquela coluna. */
  peekTarget(lane: number, nowSec: number): Tile | undefined {
    let best: Tile | undefined;
    let bestDelta = Infinity;
    for (const t of this.tiles) {
      if (t.lane !== lane || this.hit.has(t.id)) continue;
      const delta = Math.abs(t.time - nowSec);
      if (delta < bestDelta) {
        bestDelta = delta;
        best = t;
      }
    }
    return best;
  }

  /** Registra uma pressão numa coluna no instante `nowSec`. */
  press(lane: number, nowSec: number): HitQuality {
    if (this.mutableState.status !== "playing") return "miss";

    const target = this.peekTarget(lane, nowSec);
    const delta = target ? Math.abs(target.time - nowSec) : Infinity;

    if (target === undefined || delta > GOOD_WINDOW) {
      this.mutableState.combo = 0;
      this.mutableState.status = "lost";
      return "miss";
    }

    this.hit.add(target.id);
    this.held.set(lane, target);
    const quality: HitQuality = delta <= PERFECT_WINDOW ? "perfect" : "good";
    this.mutableState.combo += 1;
    this.mutableState.maxCombo = Math.max(
      this.mutableState.maxCombo,
      this.mutableState.combo,
    );
    this.mutableState.hitCount += 1;
    this.mutableState.score += pointsFor(quality, this.mutableState.combo);
    return quality;
  }

  /** Registra o soltar de uma coluna. Dá bônus se a nota longa foi segurada. */
  release(lane: number, nowSec: number): void {
    const tile = this.held.get(lane);
    if (tile === undefined) return;
    this.held.delete(lane);
    if (this.mutableState.status !== "playing") return;
    const heldEnough = nowSec >= tile.time + tile.durationSec - GOOD_WINDOW;
    if (heldEnough) {
      this.mutableState.score += LONG_NOTE_BONUS;
    }
  }

  /** Avança o relógio: derrota se um bloco passou, vitória se todos foram tocados. */
  update(nowSec: number): void {
    if (this.mutableState.status !== "playing") return;

    for (const t of this.tiles) {
      if (this.hit.has(t.id)) continue;
      if (nowSec > t.time + GOOD_WINDOW) {
        this.mutableState.status = "lost";
        return;
      }
    }

    if (this.tiles.length > 0 && this.hit.size === this.tiles.length) {
      this.mutableState.status = "won";
    }
  }
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- game`
Expected: PASS.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm test`
Expected: PASS — toda a engine verde.

- [ ] **Step 6: Commit**

```bash
git add src/engine/game.ts src/engine/game.test.ts
git commit -m "feat: engine com press/release, peekTarget e status won/lost"
```

---

### Task 6: Barrel da engine

**Files:**
- Create: `src/engine/index.ts`
- Test: `src/engine/index.test.ts`

- [ ] **Step 1: Escrever o teste**

`src/engine/index.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { Game, generateBeatmap, DIFFICULTY, LANE_COUNT } from "./index";

describe("engine barrel", () => {
  it("reexporta a API pública da engine", () => {
    expect(typeof Game).toBe("function");
    expect(typeof generateBeatmap).toBe("function");
    expect(LANE_COUNT).toBe(4);
    expect(DIFFICULTY.medio.fallSec).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- engine/index`
Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 3: Implementar**

`src/engine/index.ts`:
```ts
export { LANE_COUNT } from "./types";
export type { MidiNote, Tile, Beatmap } from "./types";
export { generateBeatmap } from "./beatmap";
export { comboMultiplier, pointsFor, LONG_NOTE_BONUS } from "./score";
export type { HitQuality } from "./score";
export { Game, PERFECT_WINDOW, GOOD_WINDOW } from "./game";
export type { GameState, GameStatus } from "./game";
export { DIFFICULTY } from "./difficulty";
export type { DifficultyKey } from "./difficulty";
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- engine/index`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/index.ts src/engine/index.test.ts
git commit -m "feat: barrel da engine"
```

---

### Task 7: Parser MIDI

**Files:**
- Create: `src/midi/parseMidi.ts`
- Test: `src/midi/parseMidi.test.ts`

- [ ] **Step 1: Escrever o teste**

`src/midi/parseMidi.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { Midi } from "@tonejs/midi";
import { parseMidi } from "./parseMidi";

function sampleMidi(): ArrayBuffer {
  const midi = new Midi();
  const track = midi.addTrack();
  track.addNote({ midi: 60, time: 0, duration: 0.5 });
  track.addNote({ midi: 64, time: 1, duration: 0.25 });
  return midi.toArray().buffer as ArrayBuffer;
}

describe("parseMidi", () => {
  it("extrai notas com tempo, pitch e duração", () => {
    const notes = parseMidi(sampleMidi());
    expect(notes).toHaveLength(2);
    expect(notes[0].midi).toBe(60);
    expect(notes[0].time).toBeCloseTo(0);
    expect(notes[0].duration).toBeCloseTo(0.5);
    expect(notes[1].midi).toBe(64);
  });

  it("retorna lista vazia para MIDI sem notas", () => {
    const midi = new Midi();
    midi.addTrack();
    expect(parseMidi(midi.toArray().buffer as ArrayBuffer)).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- parseMidi`
Expected: FAIL — `Cannot find module './parseMidi'`.

- [ ] **Step 3: Implementar**

`src/midi/parseMidi.ts`:
```ts
import { Midi } from "@tonejs/midi";
import type { MidiNote } from "../engine/types";

/** Lê um arquivo MIDI e extrai as notas de todas as faixas, ordenadas por tempo. */
export function parseMidi(data: ArrayBuffer): MidiNote[] {
  const midi = new Midi(data);
  const notes: MidiNote[] = [];
  for (const track of midi.tracks) {
    for (const n of track.notes) {
      notes.push({ time: n.time, midi: n.midi, duration: n.duration });
    }
  }
  return notes.sort((a, b) => a.time - b.time);
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- parseMidi`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/midi/parseMidi.ts src/midi/parseMidi.test.ts
git commit -m "feat: parser MIDI via @tonejs/midi"
```

---

### Task 8: Geometria dos blocos

**Files:**
- Create: `src/render/geometry.ts`
- Test: `src/render/geometry.test.ts`

- [ ] **Step 1: Escrever o teste**

`src/render/geometry.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { laneLayout, tileBox, visibleTiles, MIN_TILE_PX } from "./geometry";

describe("laneLayout", () => {
  it("calcula linha de acerto e velocidade a partir do fallSec", () => {
    const layout = laneLayout(360, 640, 2);
    expect(layout.hitLineY).toBeGreaterThan(0);
    expect(layout.hitLineY).toBeLessThan(640);
    expect(layout.pixelsPerSecond).toBeCloseTo(layout.hitLineY / 2);
  });
});

describe("tileBox", () => {
  it("o fundo do bloco fica na linha de acerto quando now == time", () => {
    const layout = laneLayout(360, 640, 2);
    const box = tileBox(1.0, 0.5, 1.0, layout);
    expect(box.topY + box.heightPx).toBeCloseTo(layout.hitLineY);
  });

  it("respeita a altura mínima do bloco", () => {
    const layout = laneLayout(360, 640, 2);
    const box = tileBox(1.0, 0.001, 1.0, layout);
    expect(box.heightPx).toBe(MIN_TILE_PX);
  });
});

describe("visibleTiles", () => {
  it("descarta blocos fora da tela e mantém os visíveis", () => {
    const layout = laneLayout(360, 640, 2);
    const tiles = [
      { lane: 0, time: 1.0, durationSec: 0.5 }, // na linha — visível
      { lane: 1, time: 100, durationSec: 0.5 }, // muito longe — fora
    ];
    const result = visibleTiles(tiles, 1.0, layout);
    expect(result).toHaveLength(1);
    expect(result[0].lane).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- geometry`
Expected: FAIL — `Cannot find module './geometry'`.

- [ ] **Step 3: Implementar**

`src/render/geometry.ts`:
```ts
/** Altura mínima de um bloco, em pixels. */
export const MIN_TILE_PX = 44;
/** Fração da altura onde fica a linha de acerto. */
const HIT_LINE_RATIO = 0.82;

export interface LaneLayout {
  readonly width: number;
  readonly height: number;
  readonly hitLineY: number;
  readonly pixelsPerSecond: number;
}

export interface RenderTile {
  readonly lane: number;
  readonly topY: number;
  readonly heightPx: number;
}

/** Layout do Canvas para uma dada dificuldade (fallSec). */
export function laneLayout(
  width: number,
  height: number,
  fallSec: number,
): LaneLayout {
  const hitLineY = height * HIT_LINE_RATIO;
  return { width, height, hitLineY, pixelsPerSecond: hitLineY / fallSec };
}

/** Posição vertical de um bloco no instante `now`. */
export function tileBox(
  time: number,
  durationSec: number,
  now: number,
  layout: LaneLayout,
): { topY: number; heightPx: number } {
  const heightPx = Math.max(MIN_TILE_PX, durationSec * layout.pixelsPerSecond);
  const bottomY = layout.hitLineY + (now - time) * layout.pixelsPerSecond;
  return { topY: bottomY - heightPx, heightPx };
}

interface TimedTile {
  readonly lane: number;
  readonly time: number;
  readonly durationSec: number;
}

/** Blocos atualmente dentro da tela, prontos para desenhar. */
export function visibleTiles(
  tiles: readonly TimedTile[],
  now: number,
  layout: LaneLayout,
): RenderTile[] {
  const result: RenderTile[] = [];
  for (const t of tiles) {
    const box = tileBox(t.time, t.durationSec, now, layout);
    if (box.topY > layout.height) continue;
    if (box.topY + box.heightPx < 0) continue;
    result.push({ lane: t.lane, topY: box.topY, heightPx: box.heightPx });
  }
  return result;
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- geometry`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/geometry.ts src/render/geometry.test.ts
git commit -m "feat: geometria dos blocos no Canvas"
```

---

### Task 9: Renderer do Canvas

**Files:**
- Create: `src/render/renderer.ts`
- Test: `src/render/renderer.test.ts`

- [ ] **Step 1: Escrever o teste**

`src/render/renderer.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { drawFrame } from "./renderer";

function mockCtx() {
  const calls: Record<string, number> = {};
  const bump = (name: string) => {
    calls[name] = (calls[name] ?? 0) + 1;
  };
  const ctx = {
    calls,
    fillStyle: "",
    strokeStyle: "",
    fillRect: () => bump("fillRect"),
    beginPath: () => bump("beginPath"),
    moveTo: () => bump("moveTo"),
    lineTo: () => bump("lineTo"),
    stroke: () => bump("stroke"),
  };
  return ctx as unknown as CanvasRenderingContext2D & {
    calls: Record<string, number>;
  };
}

describe("drawFrame", () => {
  it("desenha fundo, linha de acerto e um fillRect por bloco", () => {
    const ctx = mockCtx();
    drawFrame(ctx, {
      width: 360,
      height: 640,
      hitLineY: 525,
      laneCount: 4,
      tiles: [
        { lane: 0, topY: 100, heightPx: 60 },
        { lane: 2, topY: 200, heightPx: 90 },
      ],
    });
    // fundo (1) + linha de acerto (1) + 2 blocos = 4
    expect(ctx.calls.fillRect).toBe(4);
    // separadores de coluna = laneCount - 1
    expect(ctx.calls.stroke).toBe(3);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- renderer`
Expected: FAIL — `Cannot find module './renderer'`.

- [ ] **Step 3: Implementar**

`src/render/renderer.ts`:
```ts
import type { RenderTile } from "./geometry";

const COLOR_BG = "#11121b";
const COLOR_LANE_LINE = "rgba(255,255,255,0.06)";
const COLOR_HIT_LINE = "rgba(255,203,71,0.5)";
const COLOR_TILE = "#3d6cff";
const HIT_LINE_THICKNESS = 4;
const TILE_INSET_RATIO = 0.08;

export interface Frame {
  readonly width: number;
  readonly height: number;
  readonly hitLineY: number;
  readonly laneCount: number;
  readonly tiles: readonly RenderTile[];
}

/** Desenha um quadro do jogo no contexto 2D. Função pura sobre o `ctx`. */
export function drawFrame(ctx: CanvasRenderingContext2D, frame: Frame): void {
  const { width, height, hitLineY, laneCount, tiles } = frame;
  const laneWidth = width / laneCount;

  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = COLOR_LANE_LINE;
  for (let l = 1; l < laneCount; l++) {
    ctx.beginPath();
    ctx.moveTo(l * laneWidth, 0);
    ctx.lineTo(l * laneWidth, height);
    ctx.stroke();
  }

  ctx.fillStyle = COLOR_TILE;
  for (const t of tiles) {
    const x = t.lane * laneWidth + laneWidth * TILE_INSET_RATIO;
    const w = laneWidth * (1 - 2 * TILE_INSET_RATIO);
    ctx.fillRect(x, t.topY, w, t.heightPx);
  }

  ctx.fillStyle = COLOR_HIT_LINE;
  ctx.fillRect(0, hitLineY - HIT_LINE_THICKNESS / 2, width, HIT_LINE_THICKNESS);
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- renderer`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/render/renderer.ts src/render/renderer.test.ts
git commit -m "feat: renderer do Canvas"
```

---

### Task 10: Wrapper de áudio (piano)

**Files:**
- Create: `src/audio/piano.ts`
- Test: `src/audio/piano.test.ts`
- Asset: `public/samples/piano/*.mp3`

- [ ] **Step 1: Obter os samples de piano**

Baixar 5 samples de piano (notas Dó de várias oitavas — o `Tone.Sampler` interpola as demais) e colocá-los em `public/samples/piano/` com os nomes `C2.mp3`, `C3.mp3`, `C4.mp3`, `C5.mp3`, `C6.mp3`. Fonte sugerida: projeto `nbrosowsky/tonejs-instruments` (samples livres de piano). Se algum sample faltar, o jogo ainda roda — apenas com menos fidelidade sonora. Os arquivos em `public/` são copiados para o bundle (funciona offline no Android).

- [ ] **Step 2: Escrever o teste**

`src/audio/piano.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("tone", () => {
  const sampler = {
    toDestination() {
      return this;
    },
    triggerAttackRelease: vi.fn(),
  };
  return {
    start: vi.fn().mockResolvedValue(undefined),
    loaded: vi.fn().mockResolvedValue(undefined),
    Sampler: vi.fn(() => sampler),
    Frequency: () => ({ toFrequency: () => 440 }),
  };
});

import { Piano } from "./piano";

describe("Piano", () => {
  it("play antes de load não lança", () => {
    const piano = new Piano();
    expect(() => piano.play(60)).not.toThrow();
  });

  it("carrega e toca sem erro", async () => {
    const piano = new Piano();
    await piano.load();
    expect(() => piano.play(60)).not.toThrow();
  });
});
```

- [ ] **Step 3: Rodar o teste e ver falhar**

Run: `npm test -- piano`
Expected: FAIL — `Cannot find module './piano'`.

- [ ] **Step 4: Implementar**

`src/audio/piano.ts`:
```ts
import * as Tone from "tone";

const SAMPLE_BASE_URL = "/samples/piano/";
const SAMPLE_MAP: Record<string, string> = {
  C2: "C2.mp3",
  C3: "C3.mp3",
  C4: "C4.mp3",
  C5: "C5.mp3",
  C6: "C6.mp3",
};
const NOTE_DURATION = 0.4;

/** Piano sampleado. Toca uma nota MIDI a cada chamada de `play`. */
export class Piano {
  private sampler: Tone.Sampler | undefined;

  /** Carrega os samples. Deve ser chamado após um gesto do usuário. */
  async load(): Promise<void> {
    await Tone.start();
    this.sampler = new Tone.Sampler({
      urls: SAMPLE_MAP,
      baseUrl: SAMPLE_BASE_URL,
    }).toDestination();
    await Tone.loaded();
  }

  /** Toca a nota de pitch MIDI. Noop se ainda não carregou. */
  play(midi: number): void {
    if (this.sampler === undefined) return;
    const freq = Tone.Frequency(midi, "midi").toFrequency();
    this.sampler.triggerAttackRelease(freq, NOTE_DURATION);
  }
}
```

- [ ] **Step 5: Rodar o teste e ver passar**

Run: `npm test -- piano`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/audio/piano.ts src/audio/piano.test.ts public/samples
git commit -m "feat: wrapper de áudio com piano sampleado"
```

---

### Task 11: Mapeamento de input

**Files:**
- Create: `src/game/input.ts`
- Test: `src/game/input.test.ts`

- [ ] **Step 1: Escrever o teste**

`src/game/input.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { keyToLane, LANE_FALLBACK_MIDI } from "./input";

describe("keyToLane", () => {
  it("mapeia D/F/J/K para as colunas 0..3", () => {
    expect(keyToLane("d")).toBe(0);
    expect(keyToLane("f")).toBe(1);
    expect(keyToLane("j")).toBe(2);
    expect(keyToLane("k")).toBe(3);
  });

  it("é insensível a maiúsculas", () => {
    expect(keyToLane("K")).toBe(3);
  });

  it("retorna undefined para teclas não mapeadas", () => {
    expect(keyToLane("a")).toBeUndefined();
  });
});

describe("LANE_FALLBACK_MIDI", () => {
  it("tem uma nota de fallback por coluna", () => {
    expect(LANE_FALLBACK_MIDI).toHaveLength(4);
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- game/input`
Expected: FAIL — `Cannot find module './input'`.

- [ ] **Step 3: Implementar**

`src/game/input.ts`:
```ts
/** Tecla → coluna do jogo. */
const KEY_TO_LANE: Readonly<Record<string, number>> = {
  d: 0,
  f: 1,
  j: 2,
  k: 3,
};

/** Coluna correspondente a uma tecla, ou `undefined` se não mapeada. */
export function keyToLane(key: string): number | undefined {
  return KEY_TO_LANE[key.toLowerCase()];
}

/** Nota de piano de fallback por coluna, quando a coluna não tem mais blocos. */
export const LANE_FALLBACK_MIDI: readonly number[] = [60, 62, 64, 65];
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- game/input`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/input.ts src/game/input.test.ts
git commit -m "feat: mapeamento de teclado e notas de fallback"
```

---

### Task 12: Loop de jogo

**Files:**
- Create: `src/game/gameLoop.ts`
- Test: `src/game/gameLoop.test.ts`

- [ ] **Step 1: Escrever o teste**

`src/game/gameLoop.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { GameLoop } from "./gameLoop";
import type { Beatmap } from "../engine/types";

function fakeCanvas(): HTMLCanvasElement {
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  };
  return {
    width: 360,
    height: 640,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
}

const beatmap: Beatmap = {
  tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 0.25 }],
  durationSec: 2,
};

describe("GameLoop", () => {
  it("pressLane toca a nota da coluna alvo", () => {
    const play = vi.fn();
    const loop = new GameLoop({
      beatmap,
      fallSec: 2.3,
      canvas: fakeCanvas(),
      piano: { load: vi.fn(), play } as never,
      onEnd: vi.fn(),
    });
    loop.pressLane(0);
    expect(play).toHaveBeenCalledWith(60);
  });

  it("pressLane numa coluna sem bloco perde o jogo", () => {
    const loop = new GameLoop({
      beatmap,
      fallSec: 2.3,
      canvas: fakeCanvas(),
      piano: { load: vi.fn(), play: vi.fn() } as never,
      onEnd: vi.fn(),
    });
    loop.pressLane(3);
    expect(loop.state.status).toBe("lost");
  });

  it("lança erro se o contexto 2D não estiver disponível", () => {
    const canvas = {
      width: 360,
      height: 640,
      getContext: () => null,
    } as unknown as HTMLCanvasElement;
    expect(
      () =>
        new GameLoop({
          beatmap,
          fallSec: 2.3,
          canvas,
          piano: { load: vi.fn(), play: vi.fn() } as never,
          onEnd: vi.fn(),
        }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- gameLoop`
Expected: FAIL — `Cannot find module './gameLoop'`.

- [ ] **Step 3: Implementar**

`src/game/gameLoop.ts`:
```ts
import { Game } from "../engine/game";
import type { GameState } from "../engine/game";
import { LANE_COUNT } from "../engine/types";
import type { Beatmap } from "../engine/types";
import { laneLayout, visibleTiles } from "../render/geometry";
import type { LaneLayout } from "../render/geometry";
import { drawFrame } from "../render/renderer";
import type { Piano } from "../audio/piano";
import { LANE_FALLBACK_MIDI } from "./input";

export interface GameLoopResult {
  readonly status: "won" | "lost";
  readonly state: GameState;
}

export interface GameLoopOptions {
  readonly beatmap: Beatmap;
  readonly fallSec: number;
  readonly canvas: HTMLCanvasElement;
  readonly piano: Piano;
  readonly onEnd: (result: GameLoopResult) => void;
}

/** Orquestra relógio + engine + render + áudio + input da partida. */
export class GameLoop {
  private readonly game: Game;
  private readonly options: GameLoopOptions;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly layout: LaneLayout;
  private startedAt = 0;
  private elapsedBeforePause = 0;
  private rafId = 0;
  private running = false;

  constructor(options: GameLoopOptions) {
    this.options = options;
    this.game = new Game(options.beatmap);
    const ctx = options.canvas.getContext("2d");
    if (ctx === null) throw new Error("Contexto 2D do Canvas indisponível");
    this.ctx = ctx;
    this.layout = laneLayout(
      options.canvas.width,
      options.canvas.height,
      options.fallSec,
    );
  }

  get state(): GameState {
    return this.game.state;
  }

  /** Tempo decorrido de jogo, em segundos. */
  private now(): number {
    if (!this.running) return this.elapsedBeforePause;
    return this.elapsedBeforePause + (performance.now() - this.startedAt) / 1000;
  }

  start(): void {
    this.running = true;
    this.startedAt = performance.now();
    this.frame();
  }

  pause(): void {
    if (!this.running) return;
    this.elapsedBeforePause = this.now();
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  resume(): void {
    if (this.running) return;
    this.running = true;
    this.startedAt = performance.now();
    this.frame();
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  pressLane(lane: number): void {
    const now = this.now();
    const target = this.game.peekTarget(lane, now);
    this.options.piano.play(target?.midi ?? LANE_FALLBACK_MIDI[lane]);
    this.game.press(lane, now);
  }

  releaseLane(lane: number): void {
    this.game.release(lane, this.now());
  }

  private frame(): void {
    const now = this.now();
    this.game.update(now);
    this.render(now);

    const status = this.game.state.status;
    if (status !== "playing") {
      this.stop();
      this.options.onEnd({ status, state: this.game.state });
      return;
    }
    if (this.running) {
      this.rafId = requestAnimationFrame(() => this.frame());
    }
  }

  private render(now: number): void {
    const tiles = visibleTiles(this.options.beatmap.tiles, now, this.layout);
    drawFrame(this.ctx, {
      width: this.layout.width,
      height: this.layout.height,
      hitLineY: this.layout.hitLineY,
      laneCount: LANE_COUNT,
      tiles,
    });
  }
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- gameLoop`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/gameLoop.ts src/game/gameLoop.test.ts
git commit -m "feat: loop de jogo (relógio + engine + render + áudio)"
```

---

### Task 13: Tela de Resultado

**Files:**
- Create: `src/screens/ResultScreen.tsx`
- Test: `src/screens/ResultScreen.test.tsx`

- [ ] **Step 1: Escrever o teste**

`src/screens/ResultScreen.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultScreen } from "./ResultScreen";

const baseProps = {
  score: 1200,
  maxCombo: 8,
  hitCount: 9,
  totalTiles: 10,
  onReplay: () => {},
  onBack: () => {},
};

describe("ResultScreen", () => {
  it("mostra a mensagem de vitória", () => {
    render(<ResultScreen status="won" {...baseProps} />);
    expect(screen.getByText(/venceu/i)).toBeInTheDocument();
  });

  it("mostra a mensagem de game over", () => {
    render(<ResultScreen status="lost" {...baseProps} />);
    expect(screen.getByText(/game over/i)).toBeInTheDocument();
  });

  it("exibe pontos e combo máximo", () => {
    render(<ResultScreen status="won" {...baseProps} />);
    expect(screen.getByText("1200")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("chama onReplay ao clicar em jogar de novo", async () => {
    const onReplay = vi.fn();
    render(<ResultScreen status="won" {...baseProps} onReplay={onReplay} />);
    await userEvent.click(screen.getByRole("button", { name: /jogar de novo/i }));
    expect(onReplay).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- ResultScreen`
Expected: FAIL — `Cannot find module './ResultScreen'`.

- [ ] **Step 3: Implementar**

`src/screens/ResultScreen.tsx`:
```tsx
interface ResultScreenProps {
  status: "won" | "lost";
  score: number;
  maxCombo: number;
  hitCount: number;
  totalTiles: number;
  onReplay: () => void;
  onBack: () => void;
}

export function ResultScreen({
  status,
  score,
  maxCombo,
  hitCount,
  totalTiles,
  onReplay,
  onBack,
}: ResultScreenProps) {
  const accuracy =
    totalTiles > 0 ? Math.round((hitCount / totalTiles) * 100) : 0;

  return (
    <div className="result-screen">
      <h1>{status === "won" ? "Você venceu! 🎉" : "Game Over"}</h1>
      <dl>
        <dt>Pontos</dt>
        <dd>{score}</dd>
        <dt>Combo máximo</dt>
        <dd>{maxCombo}</dd>
        <dt>Acertos</dt>
        <dd>
          {hitCount}/{totalTiles} ({accuracy}%)
        </dd>
      </dl>
      <button onClick={onReplay}>Jogar de novo</button>
      <button onClick={onBack}>Voltar</button>
    </div>
  );
}
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- ResultScreen`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/ResultScreen.tsx src/screens/ResultScreen.test.tsx
git commit -m "feat: tela de Resultado (vitória / game over)"
```

---

### Task 14: Tela de Jogo

**Files:**
- Create: `src/screens/GameScreen.tsx`
- Test: `src/screens/GameScreen.test.tsx`

- [ ] **Step 1: Escrever o teste**

`src/screens/GameScreen.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { GameScreen } from "./GameScreen";
import type { Beatmap } from "../engine/types";

const beatmap: Beatmap = {
  tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60, durationSec: 0.25 }],
  durationSec: 2,
};

describe("GameScreen", () => {
  it("monta exibindo o countdown inicial", () => {
    render(
      <GameScreen
        beatmap={beatmap}
        fallSec={2.3}
        piano={{ load: vi.fn(), play: vi.fn() } as never}
        onEnd={vi.fn()}
      />,
    );
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
```

> Nota: o countdown começa em 3, então o `GameLoop` (que exige um Canvas real) só é criado após a contagem — o teste de montagem não precisa de Canvas funcional.

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- GameScreen`
Expected: FAIL — `Cannot find module './GameScreen'`.

- [ ] **Step 3: Implementar**

`src/screens/GameScreen.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import type { Beatmap } from "../engine/types";
import type { GameState } from "../engine/game";
import { GameLoop } from "../game/gameLoop";
import { keyToLane } from "../game/input";
import type { Piano } from "../audio/piano";

interface GameScreenProps {
  beatmap: Beatmap;
  fallSec: number;
  piano: Piano;
  onEnd: (status: "won" | "lost", state: GameState) => void;
}

const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 640;
const COUNTDOWN_START = 3;

export function GameScreen({ beatmap, fallSec, piano, onEnd }: GameScreenProps) {
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
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- GameScreen`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/GameScreen.tsx src/screens/GameScreen.test.tsx
git commit -m "feat: tela de Jogo com countdown, pausa e input"
```

---

### Task 15: Tela inicial provisória

**Files:**
- Create: `src/screens/StartScreen.tsx`
- Test: `src/screens/StartScreen.test.tsx`

- [ ] **Step 1: Escrever o teste**

`src/screens/StartScreen.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartScreen } from "./StartScreen";

describe("StartScreen", () => {
  it("mostra os três botões de dificuldade", () => {
    render(<StartScreen onStart={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Lento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Médio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rápido" })).toBeInTheDocument();
  });

  it("chama onStart com a dificuldade escolhida", async () => {
    const onStart = vi.fn();
    render(<StartScreen onStart={onStart} />);
    await userEvent.click(screen.getByRole("button", { name: "Rápido" }));
    expect(onStart).toHaveBeenCalledWith("rapido");
  });
});
```

- [ ] **Step 2: Rodar o teste e ver falhar**

Run: `npm test -- StartScreen`
Expected: FAIL — `Cannot find module './StartScreen'`.

- [ ] **Step 3: Implementar**

`src/screens/StartScreen.tsx`:
```tsx
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
```

- [ ] **Step 4: Rodar o teste e ver passar**

Run: `npm test -- StartScreen`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/screens/StartScreen.tsx src/screens/StartScreen.test.tsx
git commit -m "feat: tela inicial provisória com escolha de dificuldade"
```

---

### Task 16: Integração no App + música de teste

**Files:**
- Modify: `src/App.tsx`
- Create: `src/App.test.tsx`
- Asset: `public/songs/fur-elise.mid`

- [ ] **Step 1: Adicionar a música de teste**

Obter um arquivo MIDI de **Für Elise** em domínio público (ex.: do projeto Mutopia ou de um repositório de MIDIs de domínio público) e salvá-lo como `public/songs/fur-elise.mid`. Qualquer arquivo `.mid` válido serve para validar o jogo ponta a ponta.

- [ ] **Step 2: Escrever o teste do App**

`src/App.test.tsx`:
```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("abre na tela inicial", () => {
    render(<App />);
    expect(
      screen.getByRole("button", { name: "Médio" }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Rodar o teste e ver falhar**

Run: `npm test -- App`
Expected: FAIL — `App` ainda renderiza só `<h1>Piano Game</h1>`, sem o botão.

- [ ] **Step 4: Reescrever `src/App.tsx`**

```tsx
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
```

- [ ] **Step 5: Rodar o teste e ver passar**

Run: `npm test -- App`
Expected: PASS.

- [ ] **Step 6: Rodar a suíte completa e o build**

Run: `npm test`
Expected: PASS — toda a suíte verde.

Run: `npm run build`
Expected: build conclui sem erros de TypeScript.

- [ ] **Step 7: Verificação manual**

Run: `npm run dev` e abrir o navegador.
Expected: tela inicial → escolher dificuldade → countdown 3-2-1 → blocos caindo, som ao tocar, pausa funciona → ao errar/terminar abre o Resultado → "Jogar de novo" e "Voltar" funcionam.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/App.test.tsx public/songs
git commit -m "feat: integra telas no App e embute música de teste"
```

---

## Self-Review (preenchido pelo autor do plano)

**Cobertura da spec:** escopo (T1–T16), engine press/release/win-loss (T5), beatmap durações+acordes (T3), parser MIDI (T7), render Canvas (T8–T9), áudio desacoplado (T10, T12 `pressLane`), dificuldade configurável (T2), telas Jogo/Resultado/inicial (T13–T15), countdown e pausa (T14), música de teste (T16). Pendências da revisão: `won`/`lost` (T5), barrel (T6), `Beatmap.tiles` readonly (T2.5), config Vitest (T1). ✔

**Placeholders:** nenhum — todo passo tem código ou comando concreto. Assets binários (samples de piano, `fur-elise.mid`) são passos de aquisição explícitos, não placeholders de código.

**Consistência de tipos:** `GameState`/`GameStatus`/`Game.press`/`release`/`peekTarget`, `DIFFICULTY`/`DifficultyKey`, `LaneLayout`/`RenderTile`/`Frame`, `GameLoopOptions`/`GameLoopResult`, `Piano.load`/`play` — nomes e assinaturas batem entre tasks.
