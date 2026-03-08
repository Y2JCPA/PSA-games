import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { GridManager, CELL_SIZE, GRID_SIZE } from '../systems/GridManager';
import { BuildingDef } from '@/lib/types';
import { RIDES } from '../data/rides';
import { SHOPS } from '../data/shops';
import { DECORATIONS } from '../data/decorations';
import { findPath, findBuildingEntrances } from '../utils/pathfinding';
import { RideAnimator } from '../systems/RideAnimator';

const ALL_DEFS: BuildingDef[] = [...RIDES, ...SHOPS, ...DECORATIONS];

interface GuestSprite {
  sprite: Phaser.GameObjects.Arc;
  path: { x: number; y: number }[] | null;
  pathIndex: number;
  state: 'walking' | 'queuing' | 'riding' | 'shopping' | 'leaving';
  happiness: number;
  gold: number;
  visitedCount: number;
  stateTimer: number;
  targetBuildingId: string | null;
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
  private placementMode: 'none' | 'build' | 'path' | 'bulldoze' = 'none';
  private selectedDef: BuildingDef | null = null;

  // Economy
  gold = 2000;
  private totalEarned = 0;
  private totalSpent = 0;

  // Guests
  private guests: GuestSprite[] = [];
  private guestSpawnTimer = 0;
  private guestIdCounter = 0;

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

  // Ride animations
  private rideAnimator!: RideAnimator;

  // Coin animations
  private coinPool: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super('ParkScene');
  }

  create() {
    this.gridManager = new GridManager();

    const worldW = GRID_SIZE * CELL_SIZE;
    const worldH = GRID_SIZE * CELL_SIZE;

    // Camera setup
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(worldW / 2, worldH / 2);

    // Background
    this.grassTiles = this.add.tileSprite(0, 0, worldW, worldH, 'grass').setOrigin(0);

    // Grid lines
    this.gridGraphics = this.add.graphics();
    this.drawGrid();

    // Layers
    this.pathGraphics = this.add.graphics();
    this.buildingGraphics = this.add.graphics();
    this.previewGraphics = this.add.graphics();

    // Ride animator
    this.rideAnimator = new RideAnimator();

    // Draw initial state
    this.redrawAll();

    // Input handling
    this.setupInput();

    // EventBus listeners
    this.setupEventListeners();

    // Emit initial state
    this.emitState();

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
        // Show preview
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

    // Zoom with scroll wheel
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _dx: number, dy: number) => {
      let zoom = this.cameras.main.zoom;
      zoom -= dy * 0.001;
      zoom = Phaser.Math.Clamp(zoom, 0.3, 3);
      this.cameras.main.setZoom(zoom);
    });

    // Pinch to zoom (mobile)
    this.input.addPointer(1); // Enable second pointer
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
        this.redrawAll();
        this.updateRating();
        this.emitState();
        this.spawnCoinAnimation(gx * CELL_SIZE + CELL_SIZE / 2, gy * CELL_SIZE, false);
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
    } else if (this.placementMode === 'none') {
      // Tap on a building to select it
      const cell = this.gridManager.getCell(gx, gy);
      if (cell && cell.buildingId) {
        const building = this.gridManager.buildings.get(cell.buildingId);
        if (building) {
          EventBus.emit('building-selected', {
            id: building.id,
            def: building.def,
            gridX: building.gridX,
            gridY: building.gridY,
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
          // Path borders connecting to neighbors
          this.pathGraphics.fillStyle(0xb8974e, 1);
          if (this.gridManager.isWalkable(x, y - 1)) this.pathGraphics.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE - 2, CELL_SIZE - 4, 4);
          if (this.gridManager.isWalkable(x, y + 1)) this.pathGraphics.fillRect(x * CELL_SIZE + 2, y * CELL_SIZE + CELL_SIZE - 2, CELL_SIZE - 4, 4);
          if (this.gridManager.isWalkable(x - 1, y)) this.pathGraphics.fillRect(x * CELL_SIZE - 2, y * CELL_SIZE + 2, 4, CELL_SIZE - 4);
          if (this.gridManager.isWalkable(x + 1, y)) this.pathGraphics.fillRect(x * CELL_SIZE + CELL_SIZE - 2, y * CELL_SIZE + 2, 4, CELL_SIZE - 4);
        } else if (cell.type === 'entrance') {
          this.pathGraphics.fillStyle(0xffcc00, 1);
          this.pathGraphics.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          // Draw entrance text
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
    // Remove old building texts
    this.uiTexts.forEach((t, key) => {
      if (key.startsWith('b_')) { t.destroy(); this.uiTexts.delete(key); }
    });
    // Clear old ride animations
    this.rideAnimator.clear();

    this.gridManager.buildings.forEach((building) => {
      const def = building.def;
      const px = building.gridX * CELL_SIZE;
      const py = building.gridY * CELL_SIZE;
      const pw = def.width * CELL_SIZE;
      const ph = def.height * CELL_SIZE;

      // Building body
      this.buildingGraphics.fillStyle(def.color, 1);
      this.buildingGraphics.fillRect(px + 2, py + 2, pw - 4, ph - 4);

      // Border
      this.buildingGraphics.lineStyle(2, 0xffffff, 0.6);
      this.buildingGraphics.strokeRect(px + 2, py + 2, pw - 4, ph - 4);

      if (def.category === 'rides') {
        // Animated ride — RideAnimator handles the visual
        this.rideAnimator.addRide(this, building.id, def, px + 2, py + 2, pw - 4, ph - 4);
      } else {
        // Shops & decorations: static emoji
        const t = this.add.text(px + pw / 2, py + ph / 2 - 6, def.emoji, {
          fontSize: `${Math.min(pw, ph) * 0.5}px`,
        }).setOrigin(0.5);
        this.uiTexts.set(building.id, t);
      }

      // Name label (small)
      const nameText = this.add.text(px + pw / 2, py + ph - 4, def.name, {
        fontSize: '9px',
        color: '#ffffff',
        fontFamily: 'Arial',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      this.uiTexts.set(building.id + '_name', nameText);
    });
  }

  private setupEventListeners() {
    EventBus.on('set-build-mode', (def: BuildingDef) => {
      this.placementMode = 'build';
      this.selectedDef = def;
    });

    EventBus.on('set-path-mode', () => {
      this.placementMode = 'path';
      this.selectedDef = null;
      this.previewGraphics.clear();
    });

    EventBus.on('set-bulldoze-mode', () => {
      this.placementMode = 'bulldoze';
      this.selectedDef = null;
      this.previewGraphics.clear();
    });

    EventBus.on('cancel-mode', () => {
      this.placementMode = 'none';
      this.selectedDef = null;
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
    const parkState = {
      ...gridData,
      gold: this.gold,
      rating: this.rating,
      totalEarned: this.totalEarned,
      totalSpent: this.totalSpent,
      tickCount: this.tickCount,
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

      // Clear guests
      this.guests.forEach(g => g.sprite.destroy());
      this.guests = [];

      this.redrawAll();
      this.updateRating();
      this.emitState();
    } catch (e) {
      console.error('Failed to load save:', e);
    }
  }

  update(time: number, delta: number) {
    // Always update ride animations (even when paused, they should look alive)
    this.rideAnimator.update(time);

    if (this.paused) return;

    const dt = (delta / 1000) * this.gameSpeed;
    this.tickAccumulator += dt;
    this.incomeAccumulator += dt;

    // Game tick (every 0.5 seconds real time at 1x speed)
    while (this.tickAccumulator >= 0.5) {
      this.tickAccumulator -= 0.5;
      this.tickCount++;
      this.gameTick();
    }

    // Income tick (every 3 seconds at 1x speed)
    while (this.incomeAccumulator >= 3) {
      this.incomeAccumulator -= 3;
      this.processIncome();
    }

    // Update guest sprites
    this.updateGuests(dt);
  }

  private gameTick() {
    // Spawn guests
    this.guestSpawnTimer++;
    const spawnRate = Math.max(3, 10 - Math.floor(this.rating));
    if (this.guestSpawnTimer >= spawnRate && this.guests.length < 80) {
      this.guestSpawnTimer = 0;
      this.spawnGuest();
    }
  }

  private processIncome() {
    // Each ride/shop earns based on nearby guest activity
    let income = 0;
    this.gridManager.buildings.forEach((building) => {
      const def = building.def;
      if (def.income > 0) {
        // Income scales with number of guests that have visited
        const guestsNearby = this.guests.filter(g => {
          const dist = Math.abs(g.sprite.x / CELL_SIZE - building.gridX) + Math.abs(g.sprite.y / CELL_SIZE - building.gridY);
          return dist < 4 && (g.state === 'riding' || g.state === 'shopping');
        }).length;
        income += Math.ceil(def.income * Math.max(0.2, Math.min(guestsNearby, 3) * 0.5));
      }
    });

    if (income > 0) {
      this.gold += income;
      this.totalEarned += income;
      this.emitState();

      // Coin animation from a random building
      const buildings = Array.from(this.gridManager.buildings.values());
      if (buildings.length > 0) {
        const b = buildings[Math.floor(Math.random() * buildings.length)];
        this.spawnCoinAnimation(b.gridX * CELL_SIZE + CELL_SIZE, b.gridY * CELL_SIZE, true);
      }
    }
  }

  private spawnGuest() {
    const entrances = findBuildingEntrances(this.gridManager);
    if (entrances.length === 0) return;

    const ex = this.gridManager.entranceX;
    const ey = this.gridManager.entranceY;

    // Pick a random building entrance as destination
    const target = entrances[Math.floor(Math.random() * entrances.length)];
    const path = findPath(this.gridManager, ex, ey, target.pathX, target.pathY);
    if (!path || path.length < 2) return;

    const colors = [0xff6699, 0x66aaff, 0xffaa33, 0x66ff99, 0xff66ff, 0x33ffcc];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const sprite = this.add.circle(
      ex * CELL_SIZE + CELL_SIZE / 2,
      ey * CELL_SIZE + CELL_SIZE / 2,
      5, color
    );
    sprite.setDepth(10);

    this.guests.push({
      sprite,
      path,
      pathIndex: 0,
      state: 'walking',
      happiness: 80 + Math.random() * 20,
      gold: 30 + Math.floor(Math.random() * 50),
      visitedCount: 0,
      stateTimer: 0,
      targetBuildingId: target.buildingId,
    });

    this.guestCount = this.guests.length;
    this.emitState();
  }

  private updateGuests(dt: number) {
    const toRemove: number[] = [];

    for (let i = 0; i < this.guests.length; i++) {
      const guest = this.guests[i];

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
            if (dist < speed) {
              guest.sprite.x = tx;
              guest.sprite.y = ty;
              guest.pathIndex++;
            } else {
              guest.sprite.x += (dx / dist) * speed;
              guest.sprite.y += (dy / dist) * speed;
            }
          } else {
            // Reached destination
            if (guest.targetBuildingId) {
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
          // Pulse while queuing
          guest.sprite.setScale(0.8 + Math.sin(Date.now() * 0.005) * 0.2);
          if (guest.stateTimer <= 0) {
            guest.state = 'riding';
            guest.stateTimer = 2 + Math.random() * 2;
          }
          break;

        case 'riding':
          guest.stateTimer -= dt;
          // Bounce while riding
          guest.sprite.setScale(1 + Math.sin(Date.now() * 0.01) * 0.3);
          if (guest.stateTimer <= 0) {
            guest.sprite.setScale(1);
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
          // Walk back to entrance
          if (!guest.path || guest.pathIndex >= guest.path.length - 1) {
            const ex = this.gridManager.entranceX;
            const ey = this.gridManager.entranceY;
            const gx = Math.floor(guest.sprite.x / CELL_SIZE);
            const gy = Math.floor(guest.sprite.y / CELL_SIZE);
            const leavePath = findPath(this.gridManager, gx, gy, ex, ey);
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

    // Remove departed guests
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
    if (entrances.length === 0) {
      guest.state = 'leaving';
      return;
    }

    // Pick a different building
    const others = entrances.filter(e => e.buildingId !== guest.targetBuildingId);
    const target = others.length > 0
      ? others[Math.floor(Math.random() * others.length)]
      : entrances[Math.floor(Math.random() * entrances.length)];

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

    // Ride variety (unique ride types)
    const rideTypes = new Set<string>();
    const shopTypes = new Set<string>();
    let decoCount = 0;

    this.gridManager.buildings.forEach(b => {
      if (b.def.category === 'rides') rideTypes.add(b.defId);
      if (b.def.category === 'shops') shopTypes.add(b.defId);
      if (b.def.category === 'decor') decoCount++;
    });

    score += rideTypes.size * 8;  // Up to 64 from 8 ride types
    score += shopTypes.size * 5;  // Up to 20 from 4 shop types
    score += Math.min(decoCount * 2, 20); // Up to 20 from decorations

    // Path coverage
    let pathCount = 0;
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (this.gridManager.grid[y][x].type === 'path') pathCount++;
      }
    }
    score += Math.min(pathCount, 20);

    // Normalize to 0-5 stars
    this.rating = Math.min(5, Math.round((score / 25) * 10) / 10);
    this.emitState();
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
