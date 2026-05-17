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
