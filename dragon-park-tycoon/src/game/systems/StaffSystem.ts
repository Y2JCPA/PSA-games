import * as Phaser from 'phaser';
import { PlacedStaff, StaffType } from '@/lib/types';
import { CELL_SIZE, GridManager } from './GridManager';

interface StaffSprite {
  data: PlacedStaff;
  sprite: Phaser.GameObjects.Image;
  targetX: number;
  targetY: number;
  wanderTimer: number;
}

const STAFF_TEXTURE_MAP: Record<StaffType, string> = {
  janitor: 'staff_janitor',
  mechanic: 'staff_mechanic',
  entertainer: 'staff_entertainer',
};

export class StaffSystem {
  private staffSprites: Map<string, StaffSprite> = new Map();
  private nextId = 0;

  addStaff(scene: Phaser.Scene, type: StaffType, gridX: number, gridY: number): PlacedStaff {
    const id = `staff_${this.nextId++}`;
    const data: PlacedStaff = { id, type, gridX, gridY };

    const px = gridX * CELL_SIZE + CELL_SIZE / 2;
    const py = gridY * CELL_SIZE + CELL_SIZE / 2;

    const sprite = scene.add.image(px, py, STAFF_TEXTURE_MAP[type]);
    sprite.setScale(1.5);
    sprite.setDepth(11);

    this.staffSprites.set(id, {
      data,
      sprite,
      targetX: px,
      targetY: py,
      wanderTimer: 2 + Math.random() * 3,
    });

    return data;
  }

  removeStaff(id: string) {
    const staff = this.staffSprites.get(id);
    if (staff) {
      staff.sprite.destroy();
      this.staffSprites.delete(id);
    }
  }

  update(dt: number, grid: GridManager) {
    this.staffSprites.forEach(staff => {
      staff.wanderTimer -= dt;

      if (staff.wanderTimer <= 0) {
        // Pick a new wander target near spawn position
        const baseX = staff.data.gridX;
        const baseY = staff.data.gridY;
        const range = 3;

        // Try to find a walkable cell nearby
        for (let attempt = 0; attempt < 5; attempt++) {
          const dx = Math.floor(Math.random() * (range * 2 + 1)) - range;
          const dy = Math.floor(Math.random() * (range * 2 + 1)) - range;
          const nx = baseX + dx;
          const ny = baseY + dy;
          if (grid.isWalkable(nx, ny)) {
            staff.targetX = nx * CELL_SIZE + CELL_SIZE / 2;
            staff.targetY = ny * CELL_SIZE + CELL_SIZE / 2;
            break;
          }
        }

        staff.wanderTimer = 2 + Math.random() * 3;
      }

      // Move toward target
      const dx = staff.targetX - staff.sprite.x;
      const dy = staff.targetY - staff.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        const speed = 40 * dt;
        staff.sprite.x += (dx / dist) * Math.min(speed, dist);
        staff.sprite.y += (dy / dist) * Math.min(speed, dist);
      }

      // Flip sprite based on direction
      staff.sprite.setFlipX(dx < 0);
    });
  }

  // Check if there's a mechanic near a given grid position
  hasMechanicNear(gridX: number, gridY: number, range: number = 5): boolean {
    let found = false;
    this.staffSprites.forEach(staff => {
      if (staff.data.type === 'mechanic') {
        const dist = Math.abs(staff.data.gridX - gridX) + Math.abs(staff.data.gridY - gridY);
        if (dist <= range) found = true;
      }
    });
    return found;
  }

  // Check if there's an entertainer near a given grid position
  hasEntertainerNear(gridX: number, gridY: number, range: number = 4): boolean {
    let found = false;
    this.staffSprites.forEach(staff => {
      if (staff.data.type === 'entertainer') {
        const dist = Math.abs(staff.data.gridX - gridX) + Math.abs(staff.data.gridY - gridY);
        if (dist <= range) found = true;
      }
    });
    return found;
  }

  getStaffCount(): number {
    return this.staffSprites.size;
  }

  getStaffOfType(type: StaffType): PlacedStaff[] {
    const result: PlacedStaff[] = [];
    this.staffSprites.forEach(staff => {
      if (staff.data.type === type) result.push(staff.data);
    });
    return result;
  }

  clear() {
    this.staffSprites.forEach(staff => staff.sprite.destroy());
    this.staffSprites.clear();
  }

  // Save/load
  serialize(): PlacedStaff[] {
    const result: PlacedStaff[] = [];
    this.staffSprites.forEach(staff => result.push(staff.data));
    return result;
  }

  loadFromSave(scene: Phaser.Scene, staffList: PlacedStaff[]) {
    this.clear();
    for (const s of staffList) {
      const added = this.addStaff(scene, s.type, s.gridX, s.gridY);
      // Override the generated id with saved id
      const sprite = this.staffSprites.get(added.id);
      if (sprite) {
        this.staffSprites.delete(added.id);
        sprite.data.id = s.id;
        this.staffSprites.set(s.id, sprite);
      }
    }
    // Update nextId to avoid collisions
    for (const s of staffList) {
      const num = parseInt(s.id.replace('staff_', ''));
      if (!isNaN(num) && num >= this.nextId) this.nextId = num + 1;
    }
  }
}
