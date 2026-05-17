# Piano Game — Documento de Design

**Data:** 2026-05-17
**Status:** Aprovado para planejamento de implementação

## Objetivo

Clone do jogo "Kpop Piano Beats" (estilo Magic Tiles) **sem nenhum anúncio**, com
escolha de músicas e de dificuldade. Uso pessoal — feito para a criança jogar.

Entrega em duas fases:
1. **Fase 1 — Web app** (desenvolvimento e teste no navegador).
2. **Fase 2 — Android** (mesmo código empacotado em APK via Capacitor).

## Escopo do MVP

- 5 telas: Splash, Seleção de Jogador, Seleção de Música, Ranking, Jogo (+ Resultado).
- Jogabilidade clássica (4 colunas, modo game over) com 3 níveis de dificuldade.
- Músicas via arquivos MIDI; uma música de domínio público já embutida para teste.
- Perfis de jogador criados no app; ranking — tudo **local no aparelho**.
- Sem servidor, sem internet, sem custo de hospedagem.

### Fora de escopo (MVP)

- Ranking online / compartilhado entre aparelhos.
- Modo sem game over e modo relaxado.
- Pacote pré-pronto de várias músicas (usuário adiciona seus próprios MIDIs).

## Stack

- **React + TypeScript + Vite** — as 5 telas e navegação (React Router).
- **Canvas 2D** — renderização da tela de Jogo (tiles caindo, 60fps via `requestAnimationFrame`).
- **`@tonejs/midi`** — leitura de arquivos `.mid` e extração das notas com timing.
- **`Tone.js`** — som de piano sincronizado aos acertos.
- **IndexedDB** — armazenamento dos arquivos MIDI adicionados pelo usuário.
- **localStorage** — perfis e ranking.
- **Capacitor** — empacotamento Android na Fase 2 (mesmo código).
- **Testes:** Vitest (unitário), React Testing Library (componentes), Playwright (E2E).

## Arquitetura

Estrutura modular, com a engine isolada do React (TypeScript puro, testável sem navegador):

- `engine/` — lógica do jogo: loop, hit detection, pontuação, estado da partida.
- `audio/` — wrapper do Tone.js (tocar nota de piano, som de erro).
- `midi/` — parser de MIDI + gerador de beatmap.
- `screens/` — as 5 telas React + tela de Resultado.
- `storage/` — perfis, ranking, biblioteca de músicas (localStorage + IndexedDB).

Cada unidade tem propósito único e interface bem definida, podendo ser entendida e
testada de forma independente.

## Telas e navegação

```
Splash ──► Seleção de Jogador ──► Seleção de Música ──► [escolhe dificuldade] ──► Jogo
                  │                       │                                        │
                  │                       └──► Ranking (da música)                  │
                  └──► criar/editar perfil                              fim ──► Resultado ──► volta p/ Música
```

- **Splash:** logo + carregamento de assets (~1,5s), botão "Tocar".
- **Seleção de Jogador:** lista de perfis (nome + avatar de cor/emoji); criar novo perfil;
  selecionar perfil ativo.
- **Seleção de Música:** lista de músicas (a de teste embutida + as adicionadas pelo
  usuário); botão "+ adicionar MIDI"; ao escolher uma música abre a escolha de nível
  (Lento / Médio / Rápido).
- **Ranking:** melhores pontuações por música — perfil + pontos + dificuldade.
- **Jogo:** o gameplay. Ao terminar, abre a tela de **Resultado** (pontos, combo máximo,
  % de acertos, "jogar de novo" / "voltar").

## Engine de jogo

- **Beatmap:** cada nota MIDI vira um tile `{ tempo, coluna }`. A coluna (0–3) é
  atribuída espalhando as notas pelas 4 colunas, evitando repetir a mesma coluna em
  notas muito próximas no tempo.
- **Loop:** `requestAnimationFrame` calcula a posição de cada tile em função do tempo
  decorrido e da velocidade da dificuldade. Tiles fora da tela são descartados.
- **Hit detection:** ao tocar numa coluna, seleciona o tile mais próximo da linha de
  acerto naquela coluna. Janela de tolerância classifica em `Perfeito` / `Bom` / `Errou`.
- **Pontuação:** acerto soma pontos × multiplicador de combo; `Perfeito` vale mais que
  `Bom`. O combo zera ao errar.
- **Fim de jogo:** errar um toque ou deixar um tile passar da linha encerra a partida
  (modo clássico). A música para e abre a tela de Resultado.
- **Dificuldade:** Lento / Médio / Rápido alteram **apenas a velocidade de queda** dos
  tiles — a beatmap é a mesma, preservando a sincronia com o áudio.
- **Áudio:** a cada acerto, `audio/` toca a nota de piano correspondente via Tone.js;
  erro toca um som de erro. A música avança conforme o jogador acerta.

## Modelo de dados e persistência (tudo local)

- **Perfil:** `{ id, nome, cor, criadoEm }` → `localStorage`.
- **Música:** `{ id, titulo, origem: 'bundled' | 'user' }`; o arquivo `.mid` em si fica
  no `IndexedDB` (a música embutida vem junto no bundle do app).
- **Ranking:** `{ musicaId, dificuldade, perfilId, pontos, comboMax, data }` →
  `localStorage`, ordenado por pontos (decrescente).
- Música de teste: peça de domínio público (ex.: "Für Elise") embutida no app, livre de
  direitos autorais, apenas para validar o jogo ponta a ponta.

## Adaptação a tamanhos de tela

- App **travado em orientação retrato**.
- O Canvas da tela de Jogo redimensiona para preencher a viewport: **colunas = largura/4**;
  altura do tile e posição da linha de acerto em **proporção fixa da altura** — comportamento
  idêntico em celular pequeno, grande ou tablet.
- Respeita *safe areas* (notch / barra de gestos) via CSS `env(safe-area-inset-*)`.
- Telas React com layout fluido: listas roláveis, alvos de toque ≥ 44px.
- Faixa de larguras alvo: ~320px até tablet.

## Estratégia de testes (TDD)

- **Unitários (Vitest):** gerador de beatmap, hit detection, cálculo de pontuação/combo,
  camada de storage. Núcleo da engine testado sem navegador.
- **Componentes (React Testing Library):** navegação entre telas, criação de perfil,
  gravação de ranking.
- **E2E (Playwright):** fluxo completo — splash → escolher jogador → escolher
  música/dificuldade → jogar (input simulado) → resultado → ranking atualizado.

## Riscos e observações

- **Direitos autorais:** o app não distribui músicas kpop. Acompanha apenas uma peça de
  domínio público. MIDIs de kpop são adicionados pelo usuário por conta própria.
- **Build Android (Fase 2):** primeira configuração exige Android Studio + SDK na máquina
  (download único). Builds seguintes levam 1–2 min.
- **Sincronia áudio:** o agendamento do Tone.js precisa estar alinhado ao loop do Canvas;
  validar latência cedo no desenvolvimento.
