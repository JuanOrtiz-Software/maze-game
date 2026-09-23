export class CollisionSystem {
  public detectCollision(x1: number, y1: number, x2: number, y2: number): boolean {
    return x1 === x2 && y1 === y2;
  }
}

export default CollisionSystem;
