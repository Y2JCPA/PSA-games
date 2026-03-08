import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Basic tiles
    this.createTexture('grass', 0x3a7d2a, 48, 48);
    this.createTexture('path', 0xc4a35a, 48, 48);
    this.createTexture('entrance', 0xffcc00, 48, 48);
    this.createTexture('grid_line', 0x2a5a1a, 48, 48);
    this.createTexture('preview_green', 0x00ff00, 48, 48);
    this.createTexture('preview_red', 0xff0000, 48, 48);
    this.createTexture('coin', 0xffd700, 8, 8);

    // Pixel art ride sprites
    this.createDragonFlightSprite();
    this.createGriffinCarouselSprite();
    this.createSeaSerpentSprite();
    this.createUnicornTrailSprite();
    this.createPhoenixDropSprite();
    this.createWyvernWhirlwindSprite();
    this.createBasiliskBumperSprite();
    this.createPegasusSwingSprite();

    // Animated guest sprites (4 types × 4 frames)
    this.createGuestSprites();

    // Staff sprites
    this.createStaffSprites();

    // Particle textures
    this.createTexture('particle_spark', 0xffd700, 4, 4);
    this.createTexture('particle_dust', 0xc4a35a, 3, 3);
    this.createTexture('particle_confetti_r', 0xff4444, 5, 5);
    this.createTexture('particle_confetti_g', 0x44ff44, 5, 5);
    this.createTexture('particle_confetti_b', 0x4444ff, 5, 5);
    this.createTexture('particle_confetti_y', 0xffff44, 5, 5);
    this.createTexture('particle_smoke', 0xaaaaaa, 6, 6);

    // Warning/broken icon
    this.createWarningSprite();
    this.createWrenchSprite();
  }

  private createTexture(key: string, color: number, w: number, h: number) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  // --- PIXEL ART RIDE SPRITES ---

  private createDragonFlightSprite() {
    const s = 32;
    const g = this.add.graphics();
    g.fillStyle(0xff4444, 1);
    g.fillRect(10, 12, 12, 8);
    g.fillRect(22, 10, 6, 6);
    g.fillRect(4, 14, 6, 4);
    g.fillRect(2, 12, 4, 3);
    g.fillStyle(0xcc2222, 1);
    g.fillRect(12, 4, 4, 8);
    g.fillRect(16, 6, 4, 6);
    g.fillRect(10, 6, 2, 6);
    g.fillRect(12, 20, 4, 6);
    g.fillRect(16, 22, 4, 4);
    g.fillStyle(0xffff00, 1);
    g.fillRect(24, 11, 2, 2);
    g.fillStyle(0xff8800, 1);
    g.fillRect(28, 12, 3, 2);
    g.generateTexture('ride_dragon_flight', s, s);
    g.destroy();
  }

  private createGriffinCarouselSprite() {
    const s = 32;
    const g = this.add.graphics();
    g.fillStyle(0xffd700, 1);
    g.fillRect(4, 2, 24, 4);
    g.fillRect(8, 0, 16, 2);
    g.fillStyle(0xccaa44, 1);
    g.fillRect(14, 6, 4, 20);
    g.fillStyle(0xff6644, 1);
    g.fillRect(2, 18, 6, 6);
    g.fillRect(24, 18, 6, 6);
    g.fillStyle(0x888888, 1);
    g.fillRect(4, 10, 2, 8);
    g.fillRect(26, 10, 2, 8);
    g.fillStyle(0x886633, 1);
    g.fillRect(6, 26, 20, 4);
    g.generateTexture('ride_griffin_carousel', s, s);
    g.destroy();
  }

  private createSeaSerpentSprite() {
    const s = 32;
    const g = this.add.graphics();
    g.fillStyle(0x2266cc, 0.6);
    g.fillRect(0, 18, 32, 14);
    g.fillStyle(0x8B4513, 1);
    g.fillRect(6, 14, 20, 6);
    g.fillRect(4, 16, 2, 4);
    g.fillRect(26, 16, 2, 4);
    g.fillStyle(0x88ccff, 1);
    g.fillRect(2, 12, 3, 3);
    g.fillRect(27, 12, 3, 3);
    g.fillRect(0, 10, 2, 2);
    g.fillRect(30, 10, 2, 2);
    g.fillStyle(0x4488ff, 0.7);
    g.fillRect(0, 22, 4, 2);
    g.fillRect(8, 24, 4, 2);
    g.fillRect(16, 22, 4, 2);
    g.fillRect(24, 24, 4, 2);
    g.generateTexture('ride_sea_serpent', s, s);
    g.destroy();
  }

  private createUnicornTrailSprite() {
    const s = 32;
    const g = this.add.graphics();
    g.fillStyle(0xff88ff, 0.4);
    g.fillRect(0, 14, 8, 4);
    g.fillRect(8, 10, 8, 4);
    g.fillRect(16, 14, 8, 4);
    g.fillRect(24, 10, 8, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(12, 6, 8, 6);
    g.fillRect(20, 4, 4, 4);
    g.fillStyle(0xffd700, 1);
    g.fillRect(22, 0, 2, 4);
    g.fillStyle(0xdddddd, 1);
    g.fillRect(13, 12, 2, 4);
    g.fillRect(17, 12, 2, 4);
    g.fillStyle(0xff44ff, 1);
    g.fillRect(10, 6, 2, 2);
    g.fillStyle(0x44ffff, 1);
    g.fillRect(8, 7, 2, 2);
    g.fillStyle(0xffaaff, 0.8);
    g.fillRect(4, 8, 2, 2);
    g.fillRect(28, 6, 2, 2);
    g.generateTexture('ride_unicorn_trail', s, s);
    g.destroy();
  }

  private createPhoenixDropSprite() {
    const s = 32;
    const g = this.add.graphics();
    g.fillStyle(0x555555, 1);
    g.fillRect(12, 0, 8, 28);
    g.fillStyle(0xff6600, 1);
    g.fillRect(10, 0, 12, 4);
    g.fillStyle(0xff4400, 1);
    g.fillRect(10, 10, 12, 6);
    g.fillStyle(0xffaa00, 1);
    g.fillRect(12, 11, 8, 4);
    g.fillStyle(0x666666, 1);
    g.fillRect(8, 28, 16, 4);
    g.fillStyle(0xff8800, 0.7);
    g.fillRect(6, 26, 3, 3);
    g.fillRect(23, 26, 3, 3);
    g.generateTexture('ride_phoenix_drop', s, s);
    g.destroy();
  }

  private createWyvernWhirlwindSprite() {
    const s = 32;
    const g = this.add.graphics();
    g.fillStyle(0x66cc66, 1);
    g.fillRect(12, 12, 8, 8);
    g.fillStyle(0x44aa44, 1);
    g.fillRect(14, 2, 4, 10);
    g.fillRect(14, 20, 4, 10);
    g.fillRect(2, 14, 10, 4);
    g.fillRect(20, 14, 10, 4);
    g.fillStyle(0x88ee88, 1);
    g.fillRect(13, 0, 6, 4);
    g.fillRect(13, 28, 6, 4);
    g.fillRect(0, 13, 4, 6);
    g.fillRect(28, 13, 4, 6);
    g.generateTexture('ride_wyvern_whirlwind', s, s);
    g.destroy();
  }

  private createBasiliskBumperSprite() {
    const s = 32;
    const g = this.add.graphics();
    g.fillStyle(0x886644, 0.5);
    g.fillRect(2, 2, 28, 28);
    g.lineStyle(2, 0xaa8866);
    g.strokeRect(2, 2, 28, 28);
    g.fillStyle(0xdd4444, 1);
    g.fillRect(4, 4, 8, 6);
    g.fillStyle(0x44dd44, 1);
    g.fillRect(20, 4, 8, 6);
    g.fillStyle(0x4444dd, 1);
    g.fillRect(4, 22, 8, 6);
    g.fillStyle(0xdddd44, 1);
    g.fillRect(20, 22, 8, 6);
    g.fillStyle(0xffffff, 0.6);
    g.fillRect(14, 14, 4, 4);
    g.generateTexture('ride_basilisk_bumper', s, s);
    g.destroy();
  }

  private createPegasusSwingSprite() {
    const s = 32;
    const g = this.add.graphics();
    g.fillStyle(0x999999, 1);
    g.fillRect(4, 2, 24, 3);
    g.fillStyle(0x888888, 1);
    g.fillRect(14, 5, 4, 8);
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(6, 5, 1, 14);
    g.fillRect(12, 5, 1, 12);
    g.fillRect(19, 5, 1, 12);
    g.fillRect(25, 5, 1, 14);
    g.fillStyle(0xaaddff, 1);
    g.fillRect(3, 19, 6, 5);
    g.fillRect(10, 17, 5, 5);
    g.fillRect(17, 17, 5, 5);
    g.fillRect(23, 19, 6, 5);
    g.fillStyle(0x777777, 1);
    g.fillRect(10, 26, 12, 4);
    g.generateTexture('ride_pegasus_swing', s, s);
    g.destroy();
  }

  // --- GUEST SPRITES (4 types × 4 frames as spritesheet) ---

  private createGuestSprites() {
    const types = [
      { key: 'guest_0', bodyColor: 0xff6699, hatColor: 0xff2266 },
      { key: 'guest_1', bodyColor: 0x66aaff, hatColor: 0x2266ff },
      { key: 'guest_2', bodyColor: 0xffaa33, hatColor: 0xff6600 },
      { key: 'guest_3', bodyColor: 0x66ff99, hatColor: 0x22cc44 },
    ];

    for (const type of types) {
      const g = this.add.graphics();
      for (let frame = 0; frame < 4; frame++) {
        const ox = frame * 12;
        g.fillStyle(0xffcc99, 1);
        g.fillRect(ox + 4, 0, 4, 4);
        g.fillStyle(type.hatColor, 1);
        g.fillRect(ox + 3, 0, 6, 2);
        g.fillStyle(type.bodyColor, 1);
        g.fillRect(ox + 3, 4, 6, 5);
        g.fillStyle(0x444444, 1);
        if (frame === 0) {
          g.fillRect(ox + 4, 9, 2, 3);
          g.fillRect(ox + 7, 9, 2, 3);
        } else if (frame === 1) {
          g.fillRect(ox + 3, 9, 2, 3);
          g.fillRect(ox + 8, 9, 2, 2);
        } else if (frame === 2) {
          g.fillRect(ox + 4, 9, 2, 3);
          g.fillRect(ox + 7, 9, 2, 3);
        } else {
          g.fillRect(ox + 8, 9, 2, 3);
          g.fillRect(ox + 3, 9, 2, 2);
        }
      }
      g.generateTexture(type.key, 48, 12);
      g.destroy();
    }
  }

  // --- STAFF SPRITES ---

  private createStaffSprites() {
    const staffConfigs = [
      { key: 'staff_janitor', bodyColor: 0x44aa44, toolColor: 0x886644, toolColor2: 0xccaa44 },
      { key: 'staff_mechanic', bodyColor: 0x4488cc, toolColor: 0xaaaaaa, toolColor2: 0xaaaaaa },
      { key: 'staff_entertainer', bodyColor: 0xcc44aa, toolColor: 0xffd700, toolColor2: 0xffd700 },
    ];

    for (const cfg of staffConfigs) {
      const g = this.add.graphics();
      g.fillStyle(0xffcc99, 1);
      g.fillRect(4, 0, 4, 4);
      g.fillStyle(cfg.bodyColor, 1);
      g.fillRect(3, 4, 6, 5);
      g.fillStyle(0x444444, 1);
      g.fillRect(4, 9, 2, 3);
      g.fillRect(7, 9, 2, 3);
      g.fillStyle(cfg.toolColor, 1);
      g.fillRect(10, 2, 1, 8);
      g.fillStyle(cfg.toolColor2, 1);
      g.fillRect(9, 9, 3, 3);
      g.generateTexture(cfg.key, 14, 12);
      g.destroy();
    }
  }

  // --- WARNING & WRENCH SPRITES ---

  private createWarningSprite() {
    const g = this.add.graphics();
    g.fillStyle(0xff0000, 1);
    g.fillRect(5, 0, 6, 2);
    g.fillRect(4, 2, 8, 2);
    g.fillRect(3, 4, 10, 2);
    g.fillRect(2, 6, 12, 2);
    g.fillRect(1, 8, 14, 2);
    g.fillRect(0, 10, 16, 2);
    g.fillStyle(0xffffff, 1);
    g.fillRect(7, 2, 2, 5);
    g.fillRect(7, 8, 2, 2);
    g.generateTexture('warning_icon', 16, 12);
    g.destroy();
  }

  private createWrenchSprite() {
    const g = this.add.graphics();
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(2, 0, 4, 2);
    g.fillRect(3, 2, 2, 8);
    g.fillRect(1, 8, 6, 2);
    g.fillRect(2, 10, 4, 2);
    g.generateTexture('wrench_icon', 8, 12);
    g.destroy();
  }

  create() {
    EventBus.emit('boot-complete');
    this.scene.start('ParkScene');
  }
}
