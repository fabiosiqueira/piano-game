# Piano Game

Clone do jogo "Kpop Piano Beats" (estilo Magic Tiles) **sem anúncios**, com escolha de
músicas e de dificuldade. Projeto pessoal — feito para a criança jogar.

## Como funciona

Tiles pretos descem em 4 colunas; toque no tile certo quando ele cruzar a linha de
acerto. Errar ou deixar um tile passar encerra a partida (modo clássico). A música toca
conforme você acerta.

- **3 dificuldades** por música: Lento / Médio / Rápido.
- **Músicas via MIDI:** o jogo lê arquivos `.mid`, gera os tiles e toca o som de piano.
  Acompanha uma peça de domínio público para teste; o usuário adiciona seus próprios MIDIs.
- **Perfis de jogador** criados no app e **ranking** — tudo local no aparelho, sem
  servidor e sem internet.

## Telas

Splash · Seleção de Jogador · Seleção de Música · Ranking · Jogo (+ Resultado)

## Stack

React + TypeScript + Vite · Canvas 2D · Tone.js · @tonejs/midi · Vitest / Playwright

Empacotamento Android (Fase 2) via Capacitor — mesmo código.

## Fases

1. **Web app** — desenvolvimento e teste no navegador.
2. **Android** — APK gerado via Capacitor.

## Documentação

Design completo em [`docs/superpowers/specs/2026-05-17-piano-game-design.md`](docs/superpowers/specs/2026-05-17-piano-game-design.md).

## Status

Em planejamento — design aprovado, implementação a iniciar.
