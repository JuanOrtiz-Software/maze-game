export type Vector2 = {
  x: number;
  y: number;
};

export type Direction = 'up' | 'down' | 'left' | 'right';

export type LevelData = {
  id: string;
  name: string;
  map: number[][];
};

export type EnemyConfig = {
  id: string;
  type: string;
  speed: number;
  health: number;
};

export type ItemConfig = {
  id: string;
  name: string;
  value: number;
};
