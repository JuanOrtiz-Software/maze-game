export class GameManager {
  public score = 0;

  constructor() {
    console.log('GameManager initialized');
  }

  addScore(points: number): void {
    this.score += points;
  }
}

export default GameManager;
