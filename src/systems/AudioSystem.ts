export class AudioSystem {
  public volume = 0.5;

  constructor(volume = 0.5) {
    this.volume = volume;
  }

  setVolume(value: number): void {
    this.volume = value;
  }
}

export default AudioSystem;
