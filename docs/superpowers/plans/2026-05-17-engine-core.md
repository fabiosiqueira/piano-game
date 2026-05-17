# Engine Core — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o núcleo lógico do jogo (geração de beatmap, detecção de acerto, pontuação/combo) em TypeScript puro, 100% testável via Vitest, sem UI nem áudio.

**Architecture:** A engine não depende de DOM, Canvas ou React. Recebe uma lista de notas (no formato que `@tonejs/midi` produz), gera uma beatmap (tiles distribuídos em 4 colunas) e processa eventos de jogo (`tap`, `update`) no domínio do tempo. Difficulty afeta só a velocidade de queda (render — Plano 2), então a engine é independente de dificuldade.

**Tech Stack:** Vite + React + TypeScript (scaffold), Vitest (testes unitários).

**Escopo deste plano:** Plano 1 de 4. Os planos 2-4 (tela de Jogo, telas & storage, Android) virão em sessões separadas. Ver `docs/superpowers/specs/2026-05-17-piano-game-design.md`.

---

### Task 1: Scaffold do projeto

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx` (gerados pelo scaffold)
- Create: `src/engine/smoke.test.ts`

- [ ] **Step 1: Gerar o projeto Vite React+TS**

O diretório já contém `README.md`, `.gitignore`, `docs/`. Gerar o scaffold sem sobrescrever:

```bash
npm create vite@latest . -- --template react-ts
```

Se o comando perguntar sobre arquivos existentes, escolher **"Ignore files and continue"**.

- [ ] **Step 2: Instalar dependências + Vitest**

```bash
npm install
npm install -D vitest
```

- [ ] **Step 3: Adicionar o script de teste**

Em `package.json`, no objeto `"scripts"`, adicionar:

```json
"test": "vitest --run"
```

- [ ] **Step 4: Escrever um smoke test**

Create `src/engine/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('roda o Vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Rodar os testes**

Run: `npm test`
Expected: PASS — 1 teste passa, "smoke > roda o Vitest".

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite React+TS com Vitest"
```

---

### Task 2: Tipos da engine

**Files:**
- Create: `src/engine/types.ts`
- Test: `src/engine/types.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/engine/types.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LANE_COUNT } from './types';
import type { MidiNote, Tile, Beatmap } from './types';

describe('types', () => {
  it('expõe LANE_COUNT igual a 4', () => {
    expect(LANE_COUNT).toBe(4);
  });

  it('os tipos compõem uma beatmap válida', () => {
    const note: MidiNote = { time: 0, midi: 60, duration: 0.5 };
    const tile: Tile = { id: 0, time: note.time, lane: 0, midi: note.midi };
    const beatmap: Beatmap = { tiles: [tile], durationSec: 0.5 };
    expect(beatmap.tiles[0].lane).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run: `npm test -- src/engine/types.test.ts`
Expected: FAIL — não consegue resolver `./types`.

- [ ] **Step 3: Implementar os tipos**

Create `src/engine/types.ts`:

```ts
/** Número fixo de colunas do jogo. */
export const LANE_COUNT = 4;

/** Nota crua extraída de um arquivo MIDI (formato @tonejs/midi). */
export interface MidiNote {
  /** Instante de início, em segundos. */
  time: number;
  /** Altura da nota (pitch MIDI 0-127). */
  midi: number;
  /** Duração da nota, em segundos. */
  duration: number;
}

/** Um tile que cai numa coluna e deve ser tocado em `time`. */
export interface Tile {
  /** Identificador único e estável dentro da beatmap. */
  id: number;
  /** Instante em que o tile cruza a linha de acerto, em segundos. */
  time: number;
  /** Coluna 0..LANE_COUNT-1. */
  lane: number;
  /** Pitch MIDI, usado depois para tocar o som de piano. */
  midi: number;
}

/** Beatmap completa de uma música. */
export interface Beatmap {
  tiles: Tile[];
  /** Duração total da música, em segundos. */
  durationSec: number;
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npm test -- src/engine/types.test.ts`
Expected: PASS — 2 testes.

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/types.test.ts
git commit -m "feat: tipos da engine (MidiNote, Tile, Beatmap)"
```

---

### Task 3: Gerador de beatmap

Distribui as notas MIDI pelas 4 colunas. Regra determinística: cada nota vai para a coluna **usada há mais tempo** (argmin do último uso), empate resolvido pelo menor índice. Isso espalha as notas e evita repetir a mesma coluna em notas próximas.

**Files:**
- Create: `src/engine/beatmap.ts`
- Test: `src/engine/beatmap.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/engine/beatmap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateBeatmap } from './beatmap';
import type { MidiNote } from './types';

const note = (time: number, midi = 60): MidiNote => ({ time, midi, duration: 0.25 });

describe('generateBeatmap', () => {
  it('beatmap vazia para lista vazia', () => {
    const bm = generateBeatmap([]);
    expect(bm.tiles).toEqual([]);
    expect(bm.durationSec).toBe(0);
  });

  it('distribui as 5 primeiras notas em colunas rotativas 0,1,2,3,0', () => {
    const notes = [note(0), note(1), note(2), note(3), note(4)];
    const lanes = generateBeatmap(notes).tiles.map((t) => t.lane);
    expect(lanes).toEqual([0, 1, 2, 3, 0]);
  });

  it('ordena por tempo e atribui ids sequenciais', () => {
    const notes = [note(2), note(0), note(1)];
    const tiles = generateBeatmap(notes).tiles;
    expect(tiles.map((t) => t.time)).toEqual([0, 1, 2]);
    expect(tiles.map((t) => t.id)).toEqual([0, 1, 2]);
  });

  it('preserva o pitch e calcula a duração total', () => {
    const bm = generateBeatmap([note(0, 64), note(3, 67)]);
    expect(bm.tiles[1].midi).toBe(67);
    expect(bm.durationSec).toBeCloseTo(3.25);
  });

  it('não repete a mesma coluna em duas notas consecutivas', () => {
    const notes = Array.from({ length: 20 }, (_, i) => note(i * 0.5));
    const lanes = generateBeatmap(notes).tiles.map((t) => t.lane);
    for (let i = 1; i < lanes.length; i++) {
      expect(lanes[i]).not.toBe(lanes[i - 1]);
    }
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run: `npm test -- src/engine/beatmap.test.ts`
Expected: FAIL — não consegue resolver `./beatmap`.

- [ ] **Step 3: Implementar o gerador**

Create `src/engine/beatmap.ts`:

```ts
import { LANE_COUNT } from './types';
import type { MidiNote, Tile, Beatmap } from './types';

/**
 * Gera uma beatmap a partir de notas MIDI.
 * Cada nota é atribuída à coluna usada há mais tempo (argmin do último uso),
 * o que espalha as notas e evita repetir a mesma coluna em notas próximas.
 */
export function generateBeatmap(notes: MidiNote[]): Beatmap {
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const lastUsed: number[] = new Array(LANE_COUNT).fill(-Infinity);
  const tiles: Tile[] = [];

  sorted.forEach((n, index) => {
    let lane = 0;
    for (let l = 1; l < LANE_COUNT; l++) {
      if (lastUsed[l] < lastUsed[lane]) lane = l;
    }
    lastUsed[lane] = n.time;
    tiles.push({ id: index, time: n.time, lane, midi: n.midi });
  });

  const last = sorted[sorted.length - 1];
  const durationSec = last ? last.time + last.duration : 0;

  return { tiles, durationSec };
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npm test -- src/engine/beatmap.test.ts`
Expected: PASS — 5 testes.

- [ ] **Step 5: Commit**

```bash
git add src/engine/beatmap.ts src/engine/beatmap.test.ts
git commit -m "feat: gerador de beatmap com distribuição em 4 colunas"
```

---

### Task 4: Pontuação e combo

**Files:**
- Create: `src/engine/score.ts`
- Test: `src/engine/score.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/engine/score.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { comboMultiplier, pointsFor } from './score';
import type { HitQuality } from './score';

describe('comboMultiplier', () => {
  it('multiplicador 1 abaixo de 10 de combo', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(9)).toBe(1);
  });

  it('sobe 1 a cada 10 de combo', () => {
    expect(comboMultiplier(10)).toBe(2);
    expect(comboMultiplier(20)).toBe(3);
  });

  it('satura em 4', () => {
    expect(comboMultiplier(30)).toBe(4);
    expect(comboMultiplier(999)).toBe(4);
  });
});

describe('pointsFor', () => {
  it('perfect vale 100 vezes o multiplicador', () => {
    expect(pointsFor('perfect', 0)).toBe(100);
    expect(pointsFor('perfect', 10)).toBe(200);
  });

  it('good vale 50 vezes o multiplicador', () => {
    expect(pointsFor('good', 0)).toBe(50);
  });

  it('miss vale 0', () => {
    const miss: HitQuality = 'miss';
    expect(pointsFor(miss, 30)).toBe(0);
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run: `npm test -- src/engine/score.test.ts`
Expected: FAIL — não consegue resolver `./score`.

- [ ] **Step 3: Implementar a pontuação**

Create `src/engine/score.ts`:

```ts
/** Qualidade de um toque. */
export type HitQuality = 'perfect' | 'good' | 'miss';

const BASE_POINTS: Record<HitQuality, number> = {
  perfect: 100,
  good: 50,
  miss: 0,
};

/** Multiplicador de combo: sobe 1 a cada 10 de combo, saturando em 4. */
export function comboMultiplier(combo: number): number {
  return Math.min(1 + Math.floor(combo / 10), 4);
}

/** Pontos de um toque, dado a qualidade e o combo atual (após o acerto). */
export function pointsFor(quality: HitQuality, combo: number): number {
  return BASE_POINTS[quality] * comboMultiplier(combo);
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npm test -- src/engine/score.test.ts`
Expected: PASS — 6 testes.

- [ ] **Step 5: Commit**

```bash
git add src/engine/score.ts src/engine/score.test.ts
git commit -m "feat: pontuação e multiplicador de combo"
```

---

### Task 5: Estado de jogo (detecção de acerto + game over)

A classe `Game` mantém o estado da partida e processa dois eventos no domínio do tempo:
`tap(lane, nowSec)` registra um toque, `update(nowSec)` verifica tiles que passaram.
Modo clássico: tocar errado **ou** deixar um tile passar encerra a partida.

**Files:**
- Create: `src/engine/game.ts`
- Test: `src/engine/game.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/engine/game.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { Game, PERFECT_WINDOW, GOOD_WINDOW } from './game';
import type { Beatmap } from './types';

const beatmap = (...times: number[]): Beatmap => ({
  tiles: times.map((time, id) => ({ id, time, lane: id % 4, midi: 60 })),
  durationSec: Math.max(0, ...times) + 1,
});

describe('Game.tap', () => {
  it('toque dentro da janela perfeita conta perfect', () => {
    const g = new Game(beatmap(1.0));
    expect(g.tap(0, 1.0 + PERFECT_WINDOW / 2)).toBe('perfect');
    expect(g.state.combo).toBe(1);
    expect(g.state.score).toBe(100);
  });

  it('toque fora da janela perfeita mas dentro da boa conta good', () => {
    const g = new Game(beatmap(1.0));
    expect(g.tap(0, 1.0 + (PERFECT_WINDOW + GOOD_WINDOW) / 2)).toBe('good');
    expect(g.state.score).toBe(50);
  });

  it('toque sem tile na janela conta miss e encerra o jogo', () => {
    const g = new Game(beatmap(5.0));
    expect(g.tap(0, 1.0)).toBe('miss');
    expect(g.state.combo).toBe(0);
    expect(g.state.status).toBe('over');
  });

  it('toque na coluna errada não casa com o tile', () => {
    const g = new Game(beatmap(1.0)); // tile no lane 0
    expect(g.tap(1, 1.0)).toBe('miss');
    expect(g.state.status).toBe('over');
  });

  it('não casa o mesmo tile duas vezes', () => {
    const g = new Game({
      tiles: [{ id: 0, time: 1.0, lane: 0, midi: 60 }],
      durationSec: 2,
    });
    expect(g.tap(0, 1.0)).toBe('perfect');
    expect(g.tap(0, 1.0)).toBe('miss');
  });

  it('acumula combo e maxCombo', () => {
    const g = new Game(beatmap(1.0, 2.0));
    g.tap(0, 1.0);
    g.tap(1, 2.0);
    expect(g.state.combo).toBe(2);
    expect(g.state.maxCombo).toBe(2);
    expect(g.state.hitCount).toBe(2);
  });

  it('ignora toques após o fim de jogo', () => {
    const g = new Game(beatmap(5.0));
    g.tap(0, 1.0); // miss → over
    expect(g.tap(0, 5.0)).toBe('miss');
    expect(g.state.score).toBe(0);
  });
});

describe('Game.update', () => {
  it('encerra o jogo quando um tile passa sem ser tocado', () => {
    const g = new Game(beatmap(1.0));
    g.update(1.0 + GOOD_WINDOW + 0.01);
    expect(g.state.status).toBe('over');
  });

  it('não encerra enquanto o tile ainda está na janela', () => {
    const g = new Game(beatmap(1.0));
    g.update(1.0);
    expect(g.state.status).toBe('playing');
  });

  it('encerra (vitória) quando todos os tiles foram tocados', () => {
    const g = new Game(beatmap(1.0));
    g.tap(0, 1.0);
    g.update(1.0);
    expect(g.state.status).toBe('over');
  });
});
```

- [ ] **Step 2: Rodar o teste para confirmar a falha**

Run: `npm test -- src/engine/game.test.ts`
Expected: FAIL — não consegue resolver `./game`.

- [ ] **Step 3: Implementar a classe Game**

Create `src/engine/game.ts`:

```ts
import type { Beatmap, Tile } from './types';
import { pointsFor } from './score';
import type { HitQuality } from './score';

/** Tolerância (em segundos) para um toque ser classificado como `perfect`. */
export const PERFECT_WINDOW = 0.08;
/** Tolerância (em segundos) para um toque ser classificado como `good`. */
export const GOOD_WINDOW = 0.18;

export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  status: 'playing' | 'over';
  /** Quantidade de tiles acertados. */
  hitCount: number;
  /** Total de tiles da beatmap. */
  totalTiles: number;
}

/** Estado e regras de uma partida (modo clássico). Independente de UI. */
export class Game {
  private readonly tiles: Tile[];
  private readonly hit = new Set<number>();
  readonly state: GameState;

  constructor(beatmap: Beatmap) {
    this.tiles = [...beatmap.tiles].sort((a, b) => a.time - b.time);
    this.state = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      status: 'playing',
      hitCount: 0,
      totalTiles: this.tiles.length,
    };
  }

  /** Registra um toque numa coluna no instante `nowSec`. */
  tap(lane: number, nowSec: number): HitQuality {
    if (this.state.status === 'over') return 'miss';

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

    if (!best || bestDelta > GOOD_WINDOW) {
      this.state.combo = 0;
      this.state.status = 'over';
      return 'miss';
    }

    this.hit.add(best.id);
    const quality: HitQuality = bestDelta <= PERFECT_WINDOW ? 'perfect' : 'good';
    this.state.combo += 1;
    this.state.maxCombo = Math.max(this.state.maxCombo, this.state.combo);
    this.state.hitCount += 1;
    this.state.score += pointsFor(quality, this.state.combo);
    return quality;
  }

  /** Avança o relógio: encerra o jogo se um tile passou, ou se todos foram tocados. */
  update(nowSec: number): void {
    if (this.state.status === 'over') return;

    for (const t of this.tiles) {
      if (this.hit.has(t.id)) continue;
      if (nowSec > t.time + GOOD_WINDOW) {
        this.state.status = 'over';
        return;
      }
    }

    if (this.hit.size === this.tiles.length) {
      this.state.status = 'over';
    }
  }
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

Run: `npm test -- src/engine/game.test.ts`
Expected: PASS — 10 testes.

- [ ] **Step 5: Rodar a suíte completa**

Run: `npm test`
Expected: PASS — todos os testes (smoke + types + beatmap + score + game).

- [ ] **Step 6: Commit**

```bash
git add src/engine/game.ts src/engine/game.test.ts
git commit -m "feat: estado de jogo com detecção de acerto e game over"
```

---

## Resultado

Ao fim deste plano: a engine core está completa e testada. `generateBeatmap` transforma
notas MIDI em tiles distribuídos; `Game` processa toques e tempo, mantendo pontuação,
combo e estado de fim de jogo. Tudo TypeScript puro, sem dependência de navegador.

**Próximo plano (sessão separada):** Plano 2 — Tela de Jogo (parser MIDI real com
`@tonejs/midi`, render Canvas, áudio Tone.js, integração com a engine, dificuldade).
