import { GridManager } from '../systems/GridManager';

export interface PathNode {
  x: number;
  y: number;
}

export function findPath(grid: GridManager, startX: number, startY: number, endX: number, endY: number): PathNode[] | null {
  if (!grid.isWalkable(startX, startY) || !grid.isWalkable(endX, endY)) return null;

  const visited = new Set<string>();
  const queue: { x: number; y: number; path: PathNode[] }[] = [];
  const key = (x: number, y: number) => `${x},${y}`;

  visited.add(key(startX, startY));
  queue.push({ x: startX, y: startY, path: [{ x: startX, y: startY }] });

  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.x === endX && current.y === endY) {
      return current.path;
    }

    for (const [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const k = key(nx, ny);

      if (!visited.has(k) && grid.isWalkable(nx, ny)) {
        visited.add(k);
        queue.push({ x: nx, y: ny, path: [...current.path, { x: nx, y: ny }] });
      }
    }
  }

  return null;
}

// Find all reachable path cells from a start point
export function findReachablePaths(grid: GridManager, startX: number, startY: number): PathNode[] {
  const visited = new Set<string>();
  const result: PathNode[] = [];
  const queue: PathNode[] = [{ x: startX, y: startY }];
  const key = (x: number, y: number) => `${x},${y}`;

  visited.add(key(startX, startY));

  const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const [dx, dy] of dirs) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const k = key(nx, ny);

      if (!visited.has(k) && grid.isWalkable(nx, ny)) {
        visited.add(k);
        queue.push({ x: nx, y: ny });
      }
    }
  }

  return result;
}

// Find path cells adjacent to rides/shops (for guests to visit)
export function findBuildingEntrances(grid: GridManager): { pathX: number; pathY: number; buildingId: string }[] {
  const results: { pathX: number; pathY: number; buildingId: string }[] = [];
  const seen = new Set<string>();

  for (let y = 0; y < 40; y++) {
    for (let x = 0; x < 40; x++) {
      if (!grid.isWalkable(x, y)) continue;
      const adjacent = grid.getAdjacentRidesAndShops(x, y);
      for (const b of adjacent) {
        const key = `${b.id}_${x}_${y}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ pathX: x, pathY: y, buildingId: b.id });
        }
      }
    }
  }

  return results;
}
