export class MazeSystem {
  public width = 0;
  public height = 0;

  constructor(width = 0, height = 0) {
    this.width = width;
    this.height = height;
  }

  generate(): number[][] {
    return Array.from({ length: this.height }, () =>
      Array.from({ length: this.width }, () => 0),
    );
  }
}

export default MazeSystem;
