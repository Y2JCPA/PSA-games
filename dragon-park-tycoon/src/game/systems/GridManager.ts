import { BuildingDef, PlacedBuilding } from '@/lib/types';

export const GRID_SIZE = 40;
export const CELL_SIZE = 48;

export type CellType = 'empty' | 'path' | 'ride' | 'shop' | 'decor' | 'entrance';

export interface Cell {
  type: CellType;
  buildingId: string | null;
}

export class GridManager {
  grid: Cell[][];
  buildings: Map<string, PlacedBuilding & { def: BuildingDef }>;
  entranceX: number;
  entranceY: number;
  private nextId = 0;

  constructor() {
    this.grid = [];
    this.buildings = new Map();
    this.entranceX = Math.floor(GRID_SIZE / 2);
    this.entranceY = GRID_SIZE - 1;
    this.initGrid();
  }

  private initGrid() {
    for (let y = 0; y < GRID_SIZE; y++) {
      this.grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        this.grid[y][x] = { type: 'empty', buildingId: null };
      }
    }
    // Place entrance
    this.grid[this.entranceY][this.entranceX] = { type: 'entrance', buildingId: null };
    // Place initial path from entrance
    for (let y = this.entranceY - 1; y >= this.entranceY - 5; y--) {
      this.grid[y][this.entranceX] = { type: 'path', buildingId: null };
    }
  }

  canPlace(def: BuildingDef, gx: number, gy: number): boolean {
    for (let dy = 0; dy < def.height; dy++) {
      for (let dx = 0; dx < def.width; dx++) {
        const cx = gx + dx;
        const cy = gy + dy;
        if (cx < 0 || cx >= GRID_SIZE || cy < 0 || cy >= GRID_SIZE) return false;
        if (this.grid[cy][cx].type !== 'empty') return false;
      }
    }
    return true;
  }

  place(def: BuildingDef, gx: number, gy: number): string | null {
    if (!this.canPlace(def, gx, gy)) return null;

    const id = `b_${this.nextId++}`;
    const cellType: CellType = def.category === 'rides' ? 'ride' :
      def.category === 'shops' ? 'shop' :
      def.category === 'decor' ? 'decor' : 'path';

    for (let dy = 0; dy < def.height; dy++) {
      for (let dx = 0; dx < def.width; dx++) {
        this.grid[gy + dy][gx + dx] = { type: cellType, buildingId: id };
      }
    }

    const building: PlacedBuilding & { def: BuildingDef } = {
      id,
      defId: def.id,
      gridX: gx,
      gridY: gy,
      placed_at: Date.now(),
      def,
    };
    this.buildings.set(id, building);
    return id;
  }

  placePath(gx: number, gy: number): boolean {
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return false;
    if (this.grid[gy][gx].type !== 'empty') return false;
    this.grid[gy][gx] = { type: 'path', buildingId: null };
    return true;
  }

  remove(gx: number, gy: number): BuildingDef | null {
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return null;
    const cell = this.grid[gy][gx];
    if (cell.type === 'empty' || cell.type === 'entrance') return null;

    if (cell.type === 'path') {
      this.grid[gy][gx] = { type: 'empty', buildingId: null };
      return null;
    }

    if (cell.buildingId) {
      const building = this.buildings.get(cell.buildingId);
      if (!building) return null;

      for (let dy = 0; dy < building.def.height; dy++) {
        for (let dx = 0; dx < building.def.width; dx++) {
          this.grid[building.gridY + dy][building.gridX + dx] = { type: 'empty', buildingId: null };
        }
      }
      this.buildings.delete(cell.buildingId);
      return building.def;
    }
    return null;
  }

  getCell(gx: number, gy: number): Cell | null {
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return null;
    return this.grid[gy][gx];
  }

  isWalkable(gx: number, gy: number): boolean {
    const cell = this.getCell(gx, gy);
    if (!cell) return false;
    return cell.type === 'path' || cell.type === 'entrance';
  }

  getAdjacentRidesAndShops(gx: number, gy: number): (PlacedBuilding & { def: BuildingDef })[] {
    const results: (PlacedBuilding & { def: BuildingDef })[] = [];
    const seen = new Set<string>();
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    for (const [dx, dy] of dirs) {
      const cell = this.getCell(gx + dx, gy + dy);
      if (cell?.buildingId && !seen.has(cell.buildingId)) {
        seen.add(cell.buildingId);
        const b = this.buildings.get(cell.buildingId);
        if (b) results.push(b);
      }
    }
    return results;
  }

  serialize(): { buildings: (PlacedBuilding & { defId: string })[], paths: [number, number][] } {
    const buildings: (PlacedBuilding & { defId: string })[] = [];
    this.buildings.forEach(b => {
      buildings.push({ id: b.id, defId: b.defId, gridX: b.gridX, gridY: b.gridY, placed_at: b.placed_at });
    });

    const paths: [number, number][] = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.grid[y][x].type === 'path') {
          paths.push([x, y]);
        }
      }
    }

    return { buildings, paths };
  }

  loadFromSave(data: { buildings: PlacedBuilding[], paths: [number, number][] }, allDefs: BuildingDef[]) {
    this.initGrid();
    this.buildings.clear();

    // Restore paths
    for (const [x, y] of data.paths) {
      this.grid[y][x] = { type: 'path', buildingId: null };
    }

    // Restore buildings
    const defMap = new Map(allDefs.map(d => [d.id, d]));
    for (const b of data.buildings) {
      const def = defMap.get(b.defId);
      if (!def) continue;
      const cellType: CellType = def.category === 'rides' ? 'ride' :
        def.category === 'shops' ? 'shop' : 'decor';

      for (let dy = 0; dy < def.height; dy++) {
        for (let dx = 0; dx < def.width; dx++) {
          this.grid[b.gridY + dy][b.gridX + dx] = { type: cellType, buildingId: b.id };
        }
      }
      this.buildings.set(b.id, { ...b, def });
      const idNum = parseInt(b.id.replace('b_', ''));
      if (idNum >= this.nextId) this.nextId = idNum + 1;
    }
  }
}
