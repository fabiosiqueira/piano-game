import * as Tone from "tone";

const SAMPLE_BASE_URL = "/samples/piano/";
const SAMPLE_MAP: Record<string, string> = {
  C2: "C2.mp3",
  C3: "C3.mp3",
  C4: "C4.mp3",
  C5: "C5.mp3",
  C6: "C6.mp3",
};
/** Duração (em segundos) que cada nota de piano é sustentada ao tocar. */
const NOTE_DURATION_SEC = 0.4;

/** Contrato de áudio do jogo — permite mocks estruturais nos testes. */
export interface IPiano {
  load(): Promise<void>;
  play(midi: number): void;
}

/** Piano sampleado. Toca uma nota MIDI a cada chamada de `play`. */
export class Piano implements IPiano {
  private sampler: Tone.Sampler | undefined;
  private loading = false;

  /**
   * Carrega os samples. Deve ser chamado após um gesto do usuário.
   * Idempotente: chamadas concorrentes ou repetidas não recriam o sampler.
   */
  async load(): Promise<void> {
    if (this.sampler !== undefined || this.loading) return;
    this.loading = true;
    try {
      await Tone.start();
      this.sampler = new Tone.Sampler({
        urls: SAMPLE_MAP,
        baseUrl: SAMPLE_BASE_URL,
      }).toDestination();
      await Tone.loaded();
    } finally {
      this.loading = false;
    }
  }

  /** Toca a nota de pitch MIDI. Noop se ainda não carregou. */
  play(midi: number): void {
    if (this.sampler === undefined) return;
    const freq = Tone.Frequency(midi, "midi").toFrequency();
    this.sampler.triggerAttackRelease(freq, NOTE_DURATION_SEC);
  }
}
