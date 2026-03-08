import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { GridManager, CELL_SIZE, GRID_SIZE } from '../systems/GridManager';
import { BuildingDef, StaffType } from '@/lib/types';
import { RIDES } from '../data/rides';
import { SHOPS } from '../data/shops';
import { DECORATIONS } from '../data/decorations';
import { findPath, findBuildingEntrances } from '../utils/pathfinding';
import { RideAnimator } from '../systems/RideAnimator';
import { QuestSystem } from '../systems/QuestSystem';
import { StaffSystem } from '../systems/StaffSystem';
import { STAFF_DEFS } from '../data/staff';

const ALL_DEFS: BuildingDef[] = [...RIDES, ...SHOPS, ...DECORATIONS];

const GUEST_TYPES = 4;

interface GuestSprite {
  sprite: Phaser.GameObjects.Image;
  guestType: number;
  animFrame: number;
  animTimer: number;
  path: { x: number; y: number }[] | null;
  pathIndex: number;
  state: 'walking' | 'queuing' | 'riding' | 'shopping' | 'leaving';
  happiness: number;
  gold: number;
  visitedCount: number;
  stateTimer: number;
  targetBuildingId: string | null;
}

// Ride upgrade & breakdown tracking
interface RideExtra {
  level: number;
  broken: boolean;
  breakdownTimer: number;
  repairTimer: number;
}

export class ParkScene extends Phaser.Scene {
  gridManager!: GridManager;
  private grassTiles: Phaser.GameObjects.TileSprite | null = null;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private buildingGraphics!: Phaser.GameObjects.Graphics;
  private pathGraphics!: Phaser.GameObjects.Graphics;
  private previewGraphics!: Phaser.GameObjects.Graphics;
  private uiTexts: Map<string, Phaser.GameObjects.Text> = new Map();

  // Placement mode
  private placementMode: 'none' | 'build' | 'path' | 'bulldoze' | 'staff' = 'none';
  private selectedDef: BuildingDef | null = null;
  private selectedStaffType: StaffType | null = null;

  // Economy
  gold = 2000;
  private totalEarned = 0;
  private totalSpent = 0;

  // Guests
  private guests: GuestSprite[] = [];
  private guestSpawnTimer = 0;

  // Rating
  rating = 0;
  guestCount = 0;

  // Speed
  private gameSpeed = 1;
  private paused = false;

  // Tick
  private tickAccumulator = 0;
  private tickCount = 0;
  private incomeAccumulator = 0;

  // Camera control
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private camStartX = 0;
  private camStartY = 0;
  private pinchStartDist = 0;
  private pinchStartZoom = 1;

  // Systems
  private rideAnimator!: RideAnimator;
  private questSystem!: QuestSystem;
  private staffSystem!: StaffSystem;

  // Ride extras (upgrade levels + breakdowns)
  private rideExtras: Map<string, RideExtra> = new Map();
  private breakdownCheckTimer = 0;

  // Breakdown overlay objects
  private breakdownOverlays: Map<string, Phaser.GameObjects.GameObject[]> = new Map();

  constructor() {
    super('ParkScene');
  }

  create() {
    this.gridManager = new GridManager();

    const worldW = GRID_SIZE * CELL_SIZE;
    const worldH = GRID_SIZE * CELL_SIZE;

    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(worldW / 2, worldH / 2);

    this.grassTiles = this.add.tileSprite(0, 0, worldW, worldH, 'grass').setOrigin(0);

    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    this.pathGraphics = this.add.graphics();
    this.buildingGraphics = this.add.graphics();
    this.previewGraphics = this.add.graphics();

    this.rideAnimator = new RideAnimator();
    this.questSystem = new QuestSystem();
    this.staffSystem = new StaffSystem();

    this.redrawAll();
    this.setupInput();
    this.setupEventListeners();
    this.emitState();
    this.questSystem.emitState();

    EventBus.emit('scene-ready', this);
  }

  private drawGrid() {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x2a5a1a, 0.3);
    for (let x = 0; x <= GRID_SIZE; x++) {
      this.gridGraphics.lineBetween(x * CELL_SIZE, 0, x * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    }
    for (let y = 0; y <= GRID_SIZE; y++) {
      this.gridGraphics.lineBetween(0, y * CELL_SIZE, GRID_SIZE * CELL_SIZE, y * CELL_SIZE);
    }
  }

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) return;
      this.isDragging = false;
      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;
      this.camStartX = this.cameras.main.scrollX;
      this.camStartY = this.cameras.main.scrollY;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) {
        if (this.placementMode === 'build' && this.selectedDef) {
          this.showPreview(pointer);
        }
        return;
      }

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 15) {
        this.isDragging = true;
        const zoom = this.cameras.main.zoom;
        this.cameras.main.scrollX = this.camStartX - dx / zoom;
        this.cameras.main.scrollY = this.camStartY - dy / zoom;
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging) {
        this.handleTap(pointer);
      }
      this.isDragging = false;
    });

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      let zoom = this.cameras.main.zoom;
      zoom -= dy * 0.001;
      zoom = Phaser.Math.Clamp(zoom, 0.3, 3);
      this.cameras.main.setZoom(zoom);
    });

    this.input.addPointer(1);
    this.input.on('pointerdown', () => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const p1 = this.input.pointer1;
        const p2 = this.input.pointer2;
        this.pinchStartDist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        this.pinchStartZoom = this.cameras.main.zoom;
      }
    });

    this.input.on('pointermove', () => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const p1 = this.input.pointer1;
        const p2 = this.input.pointer2;
        const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
        if (this.pinchStartDist > 0) {
          let zoom = this.pinchStartZoom * (dist / this.pinchStartDist);
          zoom = Phaser.Math.Clamp(zoom, 0.3, 3);
          this.cameras.main.setZoom(zoom);
        }
      }
    });
  }

  private showPreview(pointer: Phaser.Input.Pointer) {
    this.previewGraphics.clear();
    if (!this.selectedDef) return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gx = Math.floor(worldPoint.x / CELL_SIZE);
    const gy = Math.floor(worldPoint.y / CELL_SIZE);
    const canPlace = this.gridManager.canPlace(this.selectedDef, gx, gy);

    const color = canPlace ? 0x00ff00 : 0xff0000;
    this.previewGraphics.fillStyle(color, 0.4);
    this.previewGraphics.fillRect(
      gx * CELL_SIZE, gy * CELL_SIZE,
      this.selectedDef.width * CELL_SIZE, this.selectedDef.height * CELL_SIZE
    );
  }

  private handleTap(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gx = Math.floor(worldPoint.x / CELL_SIZE);
    const gy = Math.floor(worldPoint.y / CELL_SIZE);

    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return;

    if (this.placementMode === 'build' && this.selectedDef) {
      if (this.gold < this.selectedDef.cost) {
        EventBus.emit('show-message', 'Not enough gold!');
        return;
      }
      const id = this.gridManager.place(this.selectedDef, gx, gy);
      if (id) {
        this.gold -= this.selectedDef.cost;
        this.totalSpent += this.selectedDef.cost;

        // Initialize ride extras for rides
        if (this.selectedDef.category === 'rides') {
          this.rideExtras.set(id, { level: 1, broken: false, breakdownTimer: 30 + Math.random() * 60, repairTimer: 0 });
        }

        this.redrawAll();
        this.updateRating();
        this.emitState();
        this.spawnPlacementParticles(gx * CELL_SIZE + CELL_SIZE / 2, gy * CELL_SIZE + CELL_SIZE / 2);
        this.spawnCoinAnimation(gx * CELL_SIZE + CELL_SIZE / 2, gy * CELL_SIZE, false);

        // Re-evaluate quests
        this.evaluateQuests();
      }
    } else if (this.placementMode === 'path') {
      if (this.gold < 10) {
        EventBus.emit('show-message', 'Not enough gold!');
        return;
      }
      if (this.gridManager.placePath(gx, gy)) {
        this.gold -= 10;
        this.totalSpent += 10;
        this.redrawAll();
        this.emitState();
      }
    } else if (this.placementMode === 'bulldoze') {
      // Check if tapping a ride that needs to be cleaned up from rideExtras
      const cell = this.gridManager.getCell(gx, gy);
      if (cell?.buildingId) {
        this.rideExtras.delete(cell.buildingId);
        this.clearBreakdownOverlay(cell.buildingId);
      }

      const removed = this.gridManager.remove(gx, gy);
      if (removed) {
        const refund = Math.floor(removed.cost * 0.5);
        this.gold += refund;
        this.totalEarned += refund;
        EventBus.emit('show-message', `Refunded ${refund}g`);
      }
      this.redrawAll();
      this.updateRating();
      this.emitState();
      this.evaluateQuests();
    } else if (this.placementMode === 'staff' && this.selectedStaffType) {
      // Place staff on a walkable cell
      if (!this.gridManager.isWalkable(gx, gy)) {
        EventBus.emit('show-message', 'Place staff on a path!');
        return;
      }
      const staffDef = STAFF_DEFS.find(s => s.id === this.selectedStaffType);
      if (!staffDef) return;
      if (this.gold < staffDef.cost) {
        EventBus.emit('show-message', 'Not enough gold!');
        return;
      }
      this.gold -= staffDef.cost;
      this.totalSpent += staffDef.cost;
      this.staffSystem.addStaff(this, this.selectedStaffType, gx, gy);
      this.emitState();
    } else if (this.placementMode === 'none') {
      const cell = this.gridManager.getCell(gx, gy);
      if (cell && cell.buildingId) {
        const building = this.gridManager.buildings.get(cell.buildingId);
        if (building) {
          const extra = this.rideExtras.get(cell.buildingId);
          EventBus.emit('building-selected', {
            id: building.id,
            def: building.def,
            gridX: building.gridX,
            gridY: building.gridY,
            level: extra?.level || 0,
            broken: extra?.broken || false,
          });
        }
      }
    }
  }

  redrawAll() {
    this.drawPaths();
    this.drawBuildings();
    this.previewGraphics.clear();
  }

  private drawPaths() {
    this.pathGraphics.clear();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = this.gridManager.grid[y][x];
        if (cell.type === 'path') {
          this.pathGraphics.fillStyle(0xc4a35a, 1);
          this.pathGraphics.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          this.pathGraphics.fillStyle(0xb8974e, 1);
          if (this.gridManager.isWalkable(x, y - 1)) this.pathGraphics.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE - 2, CELL_SIZE - 4, 4);
          if (this.gridManager.isWalkable(x, y + 1)) this.pathGraphics.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + CELL_SIZE - 2, CELL_SIZE - 4, 4);
          if (this.gridManager.isWalkable(x - 1, y)) this.pathGraphics.fillRect(x * CELL_SIZE - 2, y * CELL_SIZE + 2, 4, CELL_SIZE - 4);
          if (this.gridManager.isWalkable(x + 1, y)) this.pathGraphics.fillRect(x * CELL_SIZE + CELL_SIZE - 2, y * CELL_SIZE + 2, 4, CELL_SIZE - 4);
        } else if (cell.type === 'entrance') {
          this.pathGraphics.fillStyle(0xffcc00, 1);
          this.pathGraphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          if (!this.uiTexts.has('entrance')) {
            const t = this.add.text(x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2, '🚪', {
              fontSize: '24px',
            }).setOrigin(0.5);
            this.uiTexts.set('entrance', t);
          }
        }
      }
    }
  }

  private drawBuildings() {
    this.buildingGraphics.clear();
    this.uiTexts.forEach((t, key) => {
      if (key.startsWith('b_')) { t.destroy(); this.uiTexts.delete(key); }
    });
    this.rideAnimator.clear();
    // Clear all breakdown overlays and re-add them
    this.breakdownOverlays.forEach(objs => objs.forEach(o => { if (o.active) o.destroy(); }));
    this.breakdownOverlays.clear();

    this.gridManager.buildings.forEach((building) => {
      const def = building.def;
      const px = building.gridX * CELL_SIZE;
      const py = building.gridY * CELL_SIZE;
      const pw = def.width * CELL_SIZE;
      const ph = def.height * CELL_SIZE;

      const extra = this.rideExtras.get(building.id);
      const level = extra?.level || 1;

      // Building body color — shift hue for upgrades
      let color = def.color;
      if (level >= 2) {
        // Brighten
        const r = ((color >> 16) & 0xff);
        const gr = ((color >> 8) & 0xff);
        const b = (color & 0xff);
        color = ((Math.min(255, r + 30) << 16) | (Math.min(255, gr + 30) << 8) | Math.min(255, b + 30));
      }
      if (level >= 3) {
        // Golden tint
        color = 0xffd700;
      }

      this.buildingGraphics.fillStyle(color, 1);
      this.buildingGraphics.fillRect(px + 2, py + 2, pw - 4, ph - 4);

      // Border — gold for upgraded
      const borderColor = level >= 2 ? 0xffd700 : 0xffffff;
      const borderAlpha = level >= 3 ? 1 : 0.6;
      this.buildingGraphics.lineStyle(2, borderColor, borderAlpha);
      this.buildingGraphics.strokeRect(px + 2, py + 2, pw - 4, ph - 4);

      if (def.category === 'rides') {
        this.rideAnimator.addRide(this, building.id, def, px + 2, py + 2, pw - 4, ph - 4, level);

        // If broken, add overlay
        if (extra?.broken) {
          this.addBreakdownOverlay(building.id, px, py, pw, ph);
        }
      } else {
        const t = this.add.text(px + pw / 2, py + ph / 2 - 6, def.emoji, {
          fontSize: `${Math.min(pw, ph) * 0.5}px`,
        }).setOrigin(0.5);
        this.uiTexts.set(building.id, t);
      }

      // Name label
      const nameText = this.add.text(px + pw / 2, py + ph - 4, def.name, {
        fontSize: '9px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      this.uiTexts.set(building.id + '_name', nameText);

      // Level indicator for upgraded rides
      if (extra && extra.level > 1) {
        const lvlText = this.add.text(px + pw - 8, py + 6, `★${extra.level}`, {
          fontSize: '10px',
          color: '#ffd700',
          stroke: '#000000',
          strokeThickness: 2,
        }).setOrigin(0.5).setDepth(7);
        this.uiTexts.set(building.id + '_lvl', lvlText);
      }
    });
  }

  private addBreakdownOverlay(buildingId: string, px: number, py: number, pw: number, ph: number) {
    const objs: Phaser.GameObjects.GameObject[] = [];

    // Red tint overlay
    const overlay = this.add.rectangle(px + pw / 2, py + ph / 2, pw - 4, ph - 4, 0xff0000, 0.25);
    overlay.setDepth(8);
    objs.push(overlay);

    // Warning icon
    const warning = this.add.image(px + pw / 2, py + 10, 'warning_icon');
    warning.setDepth(9);
    warning.setScale(1.5);
    objs.push(warning);

    // Spark particles (simple blinking dots)
    for (let i = 0; i < 3; i++) {
      const spark = this.add.circle(
        px + pw * 0.2 + Math.random() * pw * 0.6,
        py + ph * 0.3 + Math.random() * ph * 0.4,
        2, 0xffaa00, 0
      );
      spark.setDepth(9);
      objs.push(spark);
    }

    this.breakdownOverlays.set(buildingId, objs);
  }

  private clearBreakdownOverlay(buildingId: string) {
    const objs = this.breakdownOverlays.get(buildingId);
    if (objs) {
      objs.forEach(o => { if (o.active) o.destroy(); });
      this.breakdownOverlays.delete(buildingId);
    }
  }

  private setupEventListeners() {
    EventBus.on('set-build-mode', (def: BuildingDef) => {
      this.placementMode = 'build';
      this.selectedDef = def;
      this.selectedStaffType = null;
    });

    EventBus.on('set-path-mode', () => {
      this.placementMode = 'path';
      this.selectedDef = null;
      this.selectedStaffType = null;
      this.previewGraphics.clear();
    });

    EventBus.on('set-bulldoze-mode', () => {
      this.placementMode = 'bulldoze';
      this.selectedDef = null;
      this.selectedStaffType = null;
      this.previewGraphics.clear();
    });

    EventBus.on('set-staff-mode', (staffType: StaffType) => {
      this.placementMode = 'staff';
      this.selectedDef = null;
      this.selectedStaffType = staffType;
      this.previewGraphics.clear();
    });

    EventBus.on('cancel-mode', () => {
      this.placementMode = 'none';
      this.selectedDef = null;
      this.selectedStaffType = null;
      this.previewGraphics.clear();
    });

    EventBus.on('set-speed', (speed: number) => {
      this.gameSpeed = speed;
    });

    EventBus.on('toggle-pause', () => {
      this.paused = !this.paused;
      EventBus.emit('pause-state', this.paused);
    });

    EventBus.on('save-game', () => {
      this.emitSaveData();
    });

    EventBus.on('load-save', (data: string) => {
      this.loadFromSaveData(data);
    });

    EventBus.on('watch-ride', (data: { id: string; def: BuildingDef; gridX: number; gridY: number }) => {
      this.scene.launch('RideCamScene', data);
      this.scene.pause();
    });

    EventBus.on('exit-ride-cam', () => {
      this.scene.resume();
    });

    // Ride upgrade
    EventBus.on('upgrade-ride', (buildingId: string) => {
      this.upgradeRide(buildingId);
    });

    // Ride repair
    EventBus.on('repair-ride', (buildingId: string) => {
      this.repairRide(buildingId);
    });
  }

  private emitState() {
    EventBus.emit('state-update', {
      gold: this.gold,
      rating: this.rating,
      guestCount: this.guests.length,
      gameSpeed: this.gameSpeed,
      paused: this.paused,
    });
  }

  private emitSaveData() {
    const gridData = this.gridManager.serialize();
    const rideExtrasArr = Array.from(this.rideExtras.entries()).map(([id, e]) => ({
      buildingId: id, level: e.level, broken: e.broken,
    }));
    const parkState = {
      ...gridData,
      gold: this.gold,
      rating: this.rating,
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
      tickCount: this.tickCount,
      questData: this.questSystem.serialize(),
      staffData: this.staffSystem.serialize(),
      rideExtras: rideExtrasArr,
    };
    EventBus.emit('save-data-ready', JSON.stringify(parkState));
  }

  private loadFromSaveData(dataStr: string) {
    try {
      const data = JSON.parse(dataStr);
      this.gridManager.loadFromSave({ buildings: data.buildings, paths: data.paths }, ALL_DEFS);
      this.gold = data.gold || 2000;
      this.totalEarned = data.totalEarned || 0;
      this.totalSpent = data.totalSpent || 0;
      this.tickCount = data.tickCount || 0;

      // Load quest data
      if (data.questData) {
        this.questSystem.loadFromSave(data.questData);
      }

      // Load staff data
      if (data.staffData) {
        this.staffSystem.loadFromSave(this, data.staffData);
      }

      // Load ride extras
      this.rideExtras.clear();
      if (data.rideExtras) {
        for (const re of data.rideExtras) {
          this.rideExtras.set(re.buildingId, {
            level: re.level || 1,
            broken: re.broken || false,
            breakdownTimer: 30 + Math.random() * 60,
            repairTimer: 0,
          });
        }
      }
      // Ensure all rides have extras
      this.gridManager.buildings.forEach((b) => {
        if (b.def.category === 'rides' && !this.rideExtras.has(b.id)) {
          this.rideExtras.set(b.id, { level: 1, broken: false, breakdownTimer: 30 + Math.random() * 60, repairTimer: 0 });
        }
      });

      // Clear guests
      this.guests.forEach(g => g.sprite.destroy());
      this.guests = [];

      this.redrawAll();
      this.updateRating();
      this.emitState();
      this.questSystem.emitState();
    } catch (e) {
      console.error('Failed to load save:', e);
    }
  }

  update(time: number, delta: number) {
    this.rideAnimator.update(time);

    // Animate breakdown overlays (blinking sparks)
    this.breakdownOverlays.forEach(objs => {
      for (let i = 2; i < objs.length; i++) {
        const spark = objs[i] as Phaser.GameObjects.Arc;
        if (spark && spark.active) {
          spark.alpha = Math.random() > 0.5 ? 0.8 : 0;
        }
      }
    });

    if (this.paused) return;

    const dt = (delta / 1000) * this.gameSpeed;
    this.tickAccumulator += dt;
    this.incomeAccumulator += dt;

    while (this.tickAccumulator >= 0.5) {
      this.tickAccumulator -= 0.5;
      this.tickCount++;
      this.gameTick();
    }

    while (this.incomeAccumulator >= 3) {
      this.incomeAccumulator -= 3;
      this.processIncome();
    }

    this.updateGuests(dt);
    this.staffSystem.update(dt, this.gridManager);
    this.updateBreakdowns(dt);

    // Smoke particles from shops
    this.emitShopSmoke(time);
  }

  private gameTick() {
    this.guestSpawnTimer++;
    const spawnRate = Math.max(3, 10 - Math.floor(this.rating));
    if (this.guestSpawnTimer >= spawnRate && this.guests.length < 80) {
      this.guestSpawnTimer = 0;
      this.spawnGuest();
    }

    // Evaluate quests periodically
    if (this.tickCount % 4 === 0) {
      this.evaluateQuests();
    }
  }

  private evaluateQuests() {
    let rideCount = 0;
    let shopCount = 0;
    this.gridManager.buildings.forEach(b => {
      if (b.def.category === 'rides') rideCount++;
      if (b.def.category === 'shops') shopCount++;
    });

    this.questSystem.evaluate({
      rideCount,
      shopCount,
      totalEarned: this.totalEarned,
      guestCount: this.guests.length,
      rating: this.rating,
    });
  }

  private processIncome() {
    let income = 0;
    this.gridManager.buildings.forEach((building) => {
      const def = building.def;
      if (def.income > 0) {
        // Skip broken rides
        const extra = this.rideExtras.get(building.id);
        if (extra?.broken) return;

        // Income multiplier for upgrades
        const levelMult = extra ? (1 + (extra.level - 1) * 0.5) : 1;

        const guestsNearby = this.guests.filter(g => {
          const dist = Math.abs(g.sprite.x / CELL_SIZE - building.gridX) + Math.abs(g.sprite.y / CELL_SIZE - building.gridY);
          return dist < 4 && (g.state === 'riding' || g.state === 'shopping');
        }).length;
        income += Math.ceil(def.income * levelMult * Math.max(0.2, Math.min(guestsNearby, 3) * 0.5));
      }
    });

    if (income > 0) {
      this.gold += income;
      this.totalEarned += income;
      this.emitState();

      const buildings = Array.from(this.gridManager.buildings.values());
      if (buildings.length > 0) {
        const b = buildings[Math.floor(Math.random() * buildings.length)];
        this.spawnCoinAnimation(b.gridX * CELL_SIZE + CELL_SIZE, b.gridY * CELL_SIZE, true);
      }
    }
  }

  // --- BREAKDOWN SYSTEM ---

  private updateBreakdowns(dt: number) {
    this.breakdownCheckTimer += dt;
    if (this.breakdownCheckTimer < 1) return;
    this.breakdownCheckTimer = 0;

    this.rideExtras.forEach((extra, buildingId) => {
      if (extra.broken) {
        // Auto-repair if mechanic nearby
        const building = this.gridManager.buildings.get(buildingId);
        if (building && this.staffSystem.hasMechanicNear(building.gridX, building.gridY)) {
          extra.repairTimer += 1;
          if (extra.repairTimer >= 5) {
            extra.broken = false;
            extra.repairTimer = 0;
            extra.breakdownTimer = 30 + Math.random() * 60;
            this.clearBreakdownOverlay(buildingId);
            this.redrawAll();
          }
        }
        return;
      }

      extra.breakdownTimer -= 1;
      if (extra.breakdownTimer <= 0) {
        extra.broken = true;
        extra.breakdownTimer = 0;
        extra.repairTimer = 0;

        const building = this.gridManager.buildings.get(buildingId);
        if (building) {
          const px = building.gridX * CELL_SIZE;
          const py = building.gridY * CELL_SIZE;
          const pw = building.def.width * CELL_SIZE;
          const ph = building.def.height * CELL_SIZE;
          this.addBreakdownOverlay(buildingId, px, py, pw, ph);
        }
      }
    });
  }

  private upgradeRide(buildingId: string) {
    const extra = this.rideExtras.get(buildingId);
    const building = this.gridManager.buildings.get(buildingId);
    if (!extra || !building) return;
    if (extra.level >= 3) {
      EventBus.emit('show-message', 'Max level!');
      return;
    }

    const cost = building.def.cost * extra.level;
    if (this.gold < cost) {
      EventBus.emit('show-message', 'Not enough gold!');
      return;
    }

    this.gold -= cost;
    this.totalSpent += cost;
    extra.level++;
    this.redrawAll();
    this.emitState();

    // Confetti for upgrade
    const px = building.gridX * CELL_SIZE + (building.def.width * CELL_SIZE) / 2;
    const py = building.gridY * CELL_SIZE + (building.def.height * CELL_SIZE) / 2;
    this.spawnConfetti(px, py, 8);
  }

  private repairRide(buildingId: string) {
    const extra = this.rideExtras.get(buildingId);
    const building = this.gridManager.buildings.get(buildingId);
    if (!extra || !building || !extra.broken) return;

    const cost = Math.floor(building.def.cost * 0.3);
    if (this.gold < cost) {
      EventBus.emit('show-message', 'Not enough gold!');
      return;
    }

    this.gold -= cost;
    this.totalSpent += cost;
    extra.broken = false;
    extra.breakdownTimer = 30 + Math.random() * 60;
    extra.repairTimer = 0;
    this.clearBreakdownOverlay(buildingId);
    this.redrawAll();
    this.emitState();
    EventBus.emit('show-message', 'Ride repaired!');
  }

  // --- GUEST SYSTEM (with pixel art sprites) ---

  private spawnGuest() {
    const entrances = findBuildingEntrances(this.gridManager);
    if (entrances.length === 0) return;

    // Filter out broken rides
    const validEntrances = entrances.filter(e => {
      const extra = this.rideExtras.get(e.buildingId);
      if (extra?.broken) return false;
      return true;
    });
    if (validEntrances.length === 0) return;

    const ex = this.gridManager.entranceX;
    const ey = this.gridManager.entranceY;

    const target = validEntrances[Math.floor(Math.random() * validEntrances.length)];
    const path = findPath(this.gridManager, ex, ey, target.pathX, target.pathY);
    if (!path || path.length < 2) return;

    const guestType = Math.floor(Math.random() * GUEST_TYPES);
    const textureKey = `guest_${guestType}`;

    // Use the first frame from the spritesheet texture
    const sprite = this.add.image(
      ex * CELL_SIZE + CELL_SIZE / 2,
      ey * CELL_SIZE + CELL_SIZE / 2,
      textureKey
    );
    sprite.setCrop(0, 0, 12, 12);
    sprite.setScale(1.2);
    sprite.setDepth(10);

    // Entertainer happiness bonus
    let baseHappiness = 80 + Math.random() * 20;
    if (this.staffSystem.hasEntertainerNear(ex, ey)) {
      baseHappiness = Math.min(100, baseHappiness + 10);
    }

    this.guests.push({
      sprite,
      guestType,
      animFrame: 0,
      animTimer: 0,
      path,
      pathIndex: 0,
      state: 'walking',
      happiness: baseHappiness,
      gold: 30 + Math.floor(Math.random() * 50),
      visitedCount: 0,
      stateTimer: 0,
      targetBuildingId: target.buildingId,
    });

    this.guestCount = this.guests.length;
    this.emitState();
  }

  private updateGuestAnimation(guest: GuestSprite, dt: number) {
    if (guest.state !== 'walking' && guest.state !== 'leaving') return;

    guest.animTimer += dt;
    if (guest.animTimer >= 0.2) {
      guest.animTimer = 0;
      guest.animFrame = (guest.animFrame + 1) % 4;
      guest.sprite.setCrop(guest.animFrame * 12, 0, 12, 12);
    }
  }

  private updateGuests(dt: number) {
    const toRemove: number[] = [];

    for (let i = 0; i < this.guests.length; i++) {
      const guest = this.guests[i];

      // Animate walk
      this.updateGuestAnimation(guest, dt);

      switch (guest.state) {
        case 'walking':
          if (guest.path && guest.pathIndex < guest.path.length - 1) {
            const target = guest.path[guest.pathIndex + 1];
            const tx = target.x * CELL_SIZE + CELL_SIZE / 2;
            const ty = target.y * CELL_SIZE + CELL_SIZE / 2;
            const speed = 80 * dt;
            const dx = tx - guest.sprite.x;
            const dy = ty - guest.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Flip sprite based on direction
            if (dx < -1) guest.sprite.setFlipX(true);
            else if (dx > 1) guest.sprite.setFlipX(false);

            if (dist < speed) {
              guest.sprite.x = tx;
              guest.sprite.y = ty;
              guest.pathIndex++;
            } else {
              guest.sprite.x += (dx / dist) * speed;
              guest.sprite.y += (dy / dist) * speed;
            }

            // Entertainer happiness boost
            const gx = Math.floor(guest.sprite.x / CELL_SIZE);
            const gy = Math.floor(guest.sprite.y / CELL_SIZE);
            if (this.staffSystem.hasEntertainerNear(gx, gy, 3)) {
              guest.happiness = Math.min(100, guest.happiness + 0.5 * dt);
            }
          } else {
            if (guest.targetBuildingId) {
              // Check if target ride is broken
              const extra = this.rideExtras.get(guest.targetBuildingId);
              if (extra?.broken) {
                // Leave broken ride
                this.sendGuestToNextDestination(guest);
                break;
              }

              const building = this.gridManager.buildings.get(guest.targetBuildingId);
              if (building) {
                if (building.def.category === 'rides') {
                  guest.state = 'queuing';
                  guest.stateTimer = 1 + Math.random();
                } else {
                  guest.state = 'shopping';
                  guest.stateTimer = 0.8 + Math.random() * 0.5;
                }
              } else {
                guest.state = 'leaving';
              }
            } else {
              guest.state = 'leaving';
            }
          }
          break;

        case 'queuing':
          guest.stateTimer -= dt;
          guest.sprite.setScale(0.8 + Math.sin(Date.now() * 0.005) * 0.2);
          if (guest.stateTimer <= 0) {
            guest.state = 'riding';
            guest.stateTimer = 2 + Math.random() * 2;
          }
          break;

        case 'riding':
          guest.stateTimer -= dt;
          guest.sprite.setScale(1 + Math.sin(Date.now() * 0.01) * 0.3);
          if (guest.stateTimer <= 0) {
            guest.sprite.setScale(1.2);
            guest.visitedCount++;
            guest.happiness = Math.min(100, guest.happiness + 10);

            const building = this.gridManager.buildings.get(guest.targetBuildingId || '');
            if (building) {
              guest.gold -= building.def.income;
            }

            if (guest.visitedCount >= 3 || guest.gold <= 5) {
              guest.state = 'leaving';
            } else {
              this.sendGuestToNextDestination(guest);
            }
          }
          break;

        case 'shopping':
          guest.stateTimer -= dt;
          if (guest.stateTimer <= 0) {
            guest.visitedCount++;
            guest.happiness = Math.min(100, guest.happiness + 5);

            const building = this.gridManager.buildings.get(guest.targetBuildingId || '');
            if (building) {
              guest.gold -= building.def.income;
            }

            if (guest.visitedCount >= 4 || guest.gold <= 3) {
              guest.state = 'leaving';
            } else {
              this.sendGuestToNextDestination(guest);
            }
          }
          break;

        case 'leaving':
          if (!guest.path || guest.pathIndex >= guest.path.length - 1) {
            const lx = this.gridManager.entranceX;
            const ly = this.gridManager.entranceY;
            const gx = Math.floor(guest.sprite.x / CELL_SIZE);
            const gy = Math.floor(guest.sprite.y / CELL_SIZE);
            const leavePath = findPath(this.gridManager, gx, gy, lx, ly);
            if (leavePath) {
              guest.path = leavePath;
              guest.pathIndex = 0;
            } else {
              toRemove.push(i);
              continue;
            }
          }

          if (guest.pathIndex < guest.path!.length - 1) {
            const target = guest.path![guest.pathIndex + 1];
            const tx = target.x * CELL_SIZE + CELL_SIZE / 2;
            const ty = target.y * CELL_SIZE + CELL_SIZE / 2;
            const speed = 100 * dt;
            const dx = tx - guest.sprite.x;
            const dy = ty - guest.sprite.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dx < -1) guest.sprite.setFlipX(true);
            else if (dx > 1) guest.sprite.setFlipX(false);

            if (dist < speed) {
              guest.sprite.x = tx;
              guest.sprite.y = ty;
              guest.pathIndex++;
            } else {
              guest.sprite.x += (dx / dist) * speed;
              guest.sprite.y += (dy / dist) * speed;
            }
          } else {
            toRemove.push(i);
          }
          break;
      }
    }

    for (let i = toRemove.length - 1; i >= 0; i--) {
      const idx = toRemove[i];
      this.guests[idx].sprite.destroy();
      this.guests.splice(idx, 1);
    }

    if (toRemove.length > 0) {
      this.guestCount = this.guests.length;
      this.emitState();
    }
  }

  private sendGuestToNextDestination(guest: GuestSprite) {
    const entrances = findBuildingEntrances(this.gridManager);
    // Filter out broken rides
    const valid = entrances.filter(e => {
      const extra = this.rideExtras.get(e.buildingId);
      return !extra?.broken;
    });

    if (valid.length === 0) {
      guest.state = 'leaving';
      return;
    }

    const others = valid.filter(e => e.buildingId !== guest.targetBuildingId);
    const target = others.length > 0
      ? others[Math.floor(Math.random() * others.length)]
      : valid[Math.floor(Math.random() * valid.length)];

    const gx = Math.floor(guest.sprite.x / CELL_SIZE);
    const gy = Math.floor(guest.sprite.y / CELL_SIZE);

    const path = findPath(this.gridManager, gx, gy, target.pathX, target.pathY);
    if (path) {
      guest.path = path;
      guest.pathIndex = 0;
      guest.state = 'walking';
      guest.targetBuildingId = target.buildingId;
    } else {
      guest.state = 'leaving';
    }
  }

  private updateRating() {
    let score = 0;

    const rideTypes = new Set<string>();
    const shopTypes = new Set<string>();
    let decoCount = 0;

    this.gridManager.buildings.forEach(b => {
      if (b.def.category === 'rides') rideTypes.add(b.defId);
      if (b.def.category === 'shops') shopTypes.add(b.defId);
      if (b.def.category === 'decor') decoCount++;
    });

    score += rideTypes.size * 8;
    score += shopTypes.size * 5;
    score += Math.min(decoCount * 2, 20);

    let pathCount = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.gridManager.grid[y][x].type === 'path') pathCount++;
      }
    }
    score += Math.min(pathCount, 20);

    // Bonus for staff
    score += Math.min(this.staffSystem.getStaffCount() * 2, 10);

    this.rating = Math.min(5, Math.round((score / 25) * 10) / 10);
    this.emitState();
  }

  // --- PARTICLE EFFECTS ---

  private spawnPlacementParticles(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const p = this.add.circle(x, y, 3, 0xffd700, 1);
      p.setDepth(15);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
    // Dust
    for (let i = 0; i < 4; i++) {
      const d = this.add.circle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        4, 0xc4a35a, 0.6
      );
      d.setDepth(15);
      this.tweens.add({
        targets: d,
        y: d.y - 15,
        alpha: 0,
        scale: 2,
        duration: 600,
        onComplete: () => d.destroy(),
      });
    }
  }

  spawnConfetti(x: number, y: number, count: number = 15) {
    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 40;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const p = this.add.circle(x, y, 3, color, 1);
      p.setDepth(20);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed - 20,
        alpha: 0,
        duration: 800 + Math.random() * 400,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  private lastSmokeTime = 0;
  private emitShopSmoke(time: number) {
    if (time - this.lastSmokeTime < 2000) return;
    this.lastSmokeTime = time;

    this.gridManager.buildings.forEach(building => {
      if (building.def.category === 'shops') {
        const px = building.gridX * CELL_SIZE + CELL_SIZE / 2;
        const py = building.gridY * CELL_SIZE;
        const smoke = this.add.circle(px, py, 3, 0xaaaaaa, 0.4);
        smoke.setDepth(6);
        this.tweens.add({
          targets: smoke,
          y: py - 20,
          alpha: 0,
          scale: 2.5,
          duration: 1500,
          onComplete: () => smoke.destroy(),
        });
      }
    });
  }

  private spawnCoinAnimation(x: number, y: number, isIncome: boolean) {
    const coin = this.add.circle(x, y, 4, 0xffd700);
    coin.setDepth(20);

    this.tweens.add({
      targets: coin,
      y: y - 40,
      alpha: 0,
      scale: isIncome ? 1.5 : 0.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => coin.destroy(),
    });

    if (isIncome) {
      const text = this.add.text(x + 8, y - 5, `+💰`, {
        fontSize: '12px',
        color: '#ffd700',
        stroke: '#000',
        strokeThickness: 2,
      }).setDepth(20);

      this.tweens.add({
        targets: text,
        y: y - 45,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => text.destroy(),
      });
    }
  }
}
