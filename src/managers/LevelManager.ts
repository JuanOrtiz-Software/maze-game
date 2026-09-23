export class LevelManager {
  public currentLevel = 1;

  constructor() {
    console.log('LevelManager initialized');
  }

  nextLevel(): void {
    this.currentLevel += 1;
  }
}

export default LevelManager;
