# Piano Game — Plano 2: Tela de Jogo — Documento de Design

**Data:** 2026-05-17
**Status:** Aprovado para planejamento de implementação
**Contexto:** Plano 2 de 4 do roadmap. Plano 1 (engine core) concluído.
Spec geral: `docs/superpowers/specs/2026-05-17-piano-game-design.md`.

## Objetivo

Entregar a **Tela de Jogo** jogável de ponta a ponta no navegador: blocos caindo
sincronizados a uma música MIDI, mecânica de pressionar-e-segurar, áudio de piano e
tela de Resultado. Música de teste: Für Elise (domínio público), embutida.

## Mudança de mecânica em relação ao Plano 1

A engine do Plano 1 (`Game.tap()`) assumiu toque instantâneo estilo Guitar Hero. O jogo
de referência (Magic Tiles / Piano Tiles) usa **pressionar e segurar**: o jogador
pressiona o bloco e o segura enquanto ele "preenche". Blocos têm tamanhos diferentes
(= duração da nota MIDI) e às vezes dois blocos vêm em paralelo (acorde). O Plano 2
**redesenha a engine** para esse modelo. Os 25 testes do Plano 1 que assumem `tap`
instantâneo serão ajustados junto.

## Escopo do Plano 2

- Redesenho da engine para o modelo press/release com notas longas.
- Parser MIDI real (`@tonejs/midi`) e gerador de beatmap com durações e acordes.
- Renderização Canvas 2D: blocos caindo, preenchimento de nota longa, zona de acerto, HUD.
- Áudio: piano sampleado (Tone.Sampler) tocando a nota a cada acerto.
- Tela de Jogo (React) integrando engine + render + áudio + input.
- Tela de Resultado, diferenciando vitória e game over.
- Tela inicial **provisória**: título, música de teste fixa e botões Lento/Médio/Rápido.
- Música de teste Für Elise embutida.
- Countdown 3-2-1 ao iniciar; botão de pausa.

### Fora de escopo (Plano 2)

- Telas reais de navegação (Splash, Seleção de Jogador/Música, Ranking) — Plano 3.
- Persistência (perfis, ranking, biblioteca de MIDIs) — Plano 3.
- Testes E2E Playwright — Plano 3.
- Empacotamento Android — Plano 4.

## Mecânica de jogo

- **Blocos:** cada nota MIDI vira um `Tile { id, time, lane, midi, durationSec }`. A
  altura do bloco na tela é proporcional a `durationSec`.
- **Pressionar:** o jogador pressiona uma coluna quando o bloco entra na zona de acerto.
  A engine seleciona o bloco não-tocado mais próximo daquela coluna; dentro da janela de
  tolerância classifica em `perfect` / `good`; fora da janela, ou coluna sem bloco,
  conta como erro.
- **Notas longas (modelo indulgente):** pressionar no tempo certo **já garante o acerto
  e os pontos**. O preenchimento é feedback visual/sonoro. Segurar até o bloco terminar
  dá um **bônus de conclusão**. Soltar cedo não dá bônus, mas **não causa game over nem
  zera o combo**.
- **Acordes / paralelos:** notas MIDI simultâneas vão para colunas diferentes, **no
  máximo 2 ao mesmo tempo**. Acorde de 3+ notas escolhe 2.
- **Pontuação:** acerto soma pontos × multiplicador de combo; `perfect` vale mais que
  `good`; combo zera ao errar (regra do Plano 1 mantida). Bônus de conclusão de nota
  longa soma à parte.
- **Fim de jogo:**
  - **Game over (`lost`):** errar uma pressão (coluna errada / fora da janela) ou deixar
    um bloco passar da janela sem tocar.
  - **Vitória (`won`):** todos os blocos da beatmap acertados.
- **Dificuldade:** Lento / Médio / Rápido alteram **apenas o tempo de queda** do bloco.
  A beatmap é a mesma. Valores em `engine/difficulty.ts`, fáceis de ajustar.

## Engine — redesenho

`Tile` ganha `durationSec`. `Beatmap.tiles` passa a `readonly Tile[]`.

`GameState.status` passa de `'playing' | 'over'` para **`'playing' | 'won' | 'lost'`**.

API da classe `Game`:

- `press(lane: number, nowSec: number): HitQuality` — registra uma pressão. Substitui o
  antigo `tap`. Encontra o bloco não-tocado mais próximo na coluna; acerto → pontos
  imediatos; erro → `status = 'lost'`.
- `release(lane: number, nowSec: number): void` — registra o soltar. Se havia nota longa
  ativa segurada até ~o fim, concede o bônus de conclusão. Soltar cedo: sem efeito
  negativo.
- `update(nowSec: number): void` — bloco não-tocado que passou da janela → `status =
  'lost'`. Todos os blocos tocados → `status = 'won'`.

`engine/difficulty.ts`:

```ts
export const DIFFICULTY = {
  lento:  { label: 'Lento',  fallSec: 3.4 },
  medio:  { label: 'Médio',  fallSec: 2.3 },
  rapido: { label: 'Rápido', fallSec: 1.5 },
} as const;
```

`engine/index.ts` — barrel com a API pública da engine, para imports limpos nos
componentes React.

## Arquitetura de módulos

```
src/
  engine/    game.ts (redesenho), beatmap.ts, score.ts, types.ts,
             difficulty.ts (novo), index.ts (barrel — novo)
  midi/      parseMidi.ts   — @tonejs/midi: arquivo .mid → MidiNote[] com duração
  audio/     piano.ts       — wrapper Tone.Sampler: load() / play(midi)
  render/    renderer.ts    — função pura: desenha colunas, blocos, zona, HUD no Canvas
  game/      gameLoop.ts    — rAF + relógio + engine + render + áudio + input
  screens/   StartScreen.tsx (provisória), GameScreen.tsx, ResultScreen.tsx
  assets/    fur-elise.mid + samples de piano (Salamander, subconjunto, offline)
```

Princípio de isolamento: `midi/` não conhece Canvas; `engine/` não conhece React;
`render/` é função pura sobre um `CanvasRenderingContext2D`.

## Loop de jogo

- **Relógio único** baseado em `performance.now()`, iniciado ao fim do countdown 3-2-1.
  Como o áudio só dispara nos acertos (sem trilha de fundo), a sincronia é trivial: o
  relógio do Canvas comanda tudo.
- A posição Y de cada bloco é função de `(agora, tile.time, fallSec)` da dificuldade.
- **Input:** pointer events nas colunas (cobre toque e mouse) + teclas D/F/J/K para as
  colunas 0–3, traduzidos em `press`/`release` na engine.
- **Áudio desacoplado da pontuação:** toda pressão numa coluna toca uma nota de piano,
  independentemente de a engine classificar como acerto ou erro — clique errado nunca
  silencia a nota. Toca o pitch do bloco não-tocado mais próximo daquela coluna; se a
  coluna não tiver mais nenhum bloco, toca uma nota fixa de fallback daquela coluna. A
  classificação acerto/erro da engine afeta só pontos e game over.
- Pausa congela o relógio. Game over / vitória encerram o loop e abrem o Resultado.

## Telas

- **StartScreen (provisória):** título, música de teste fixa (Für Elise) e três botões
  Lento / Médio / Rápido que iniciam o jogo. Plano 3 substitui pelas telas reais.
- **GameScreen:** o `<canvas>` em retrato + HUD (Pontos à esquerda, Pausar ao centro,
  Combo à direita) + zona de acerto na base. Hospeda o loop de jogo.
- **ResultScreen:** diferencia **vitória** (comemorativa) de **game over**. Ambas mostram
  pontos, combo máximo e % de acertos, com botões "Jogar de novo" e "Voltar" (à
  StartScreen provisória).

## Áudio

- `Tone.Sampler` carregado com um subconjunto de samples de piano (Salamander /
  tonejs-instruments), **embutido no bundle** para funcionar offline (requisito do
  Android na Fase 2). O Sampler interpola as notas intermediárias.
- Carregamento dos samples acontece antes do início do jogo (na StartScreen).
- `audio/piano.ts` expõe `load()` e `play(midi)`; nenhum outro módulo conhece Tone.js.
- **Desacoplado da pontuação:** o loop chama `audio.play()` em toda pressão de coluna,
  não no resultado da engine. A nota soa sempre — um clique errado não silencia a nota.
  O pitch tocado é o do bloco-alvo da coluna (bloco não-tocado mais próximo); coluna sem
  blocos restantes usa uma nota fixa de fallback. Decisão de qual pitch tocar fica no
  loop de jogo, não na engine de pontuação.

## Estratégia de testes (TDD)

- **Unitários (Vitest):**
  - `engine/game.ts` — press/release/update, classificação perfect/good, game over por
    erro e por bloco perdido, vitória, bônus de nota longa, combo.
  - `engine/beatmap.ts` — geração com `durationSec`, distribuição em colunas, acordes
    limitados a 2 simultâneos.
  - `engine/difficulty.ts` — presença e formato dos níveis.
  - `midi/parseMidi.ts` — parse de um `.mid` fixture em `MidiNote[]`.
- **Componentes (React Testing Library):**
  - StartScreen — os três botões iniciam o jogo na dificuldade correspondente.
  - ResultScreen — renderiza estado de vitória e de game over com as estatísticas.
  - GameScreen — monta sem erro.
- **Renderer:** testado como função pura contra um `CanvasRenderingContext2D` mockado,
  verificando as chamadas-chave de desenho.
- **Config do Vitest** explicitada em `vite.config.ts` (`include`, `environment`).
- E2E Playwright fica para o Plano 3.

## Pendências da revisão da engine resolvidas neste plano

- `GameState.status` ganha `'won'` / `'lost'` — vitória e derrota distinguíveis.
- Barrel `engine/index.ts` criado.
- Config explícita do Vitest em `vite.config.ts`.
- `Beatmap.tiles` passa a `readonly Tile[]`.

## Riscos e observações

- **Redesenho da engine:** os testes do Plano 1 baseados em `tap` instantâneo serão
  reescritos para o modelo press/release. Esperado e dentro do escopo.
- **Tamanho dos samples de piano:** o subconjunto Salamander deve ser dimensionado para
  equilibrar qualidade sonora e peso do bundle (relevante para o APK no Plano 4).
- **Direitos autorais:** apenas Für Elise (domínio público) acompanha o app.
