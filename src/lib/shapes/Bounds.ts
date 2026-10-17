export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function createBounds(minX = 0, minY = 0, maxX = 0, maxY = 0): Bounds {
  return { minX, minY, maxX, maxY };
}