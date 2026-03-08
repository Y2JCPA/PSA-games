import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Create placeholder textures programmatically
    this.createTexture('grass', 0x3a7d2a, 48, 48);
    this.createTexture('path', 0xc4a35a, 48, 48);
    this.createTexture('entrance', 0xffcc00, 48, 48);
    this.createTexture('grid_line', 0x2a5a1a, 48, 48);
    this.createTexture('guest', 0xff6699, 12, 12);
    this.createTexture('preview_green', 0x00ff00, 48, 48);
    this.createTexture('preview_red', 0xff0000, 48, 48);
    this.createTexture('coin', 0xffd700, 8, 8);
  }

  private createTexture(key: string, color: number, w: number, h: number) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillRect(0, 0, w, h);
    g.generateTexture(key, w, h);
    g.destroy();
  }

  create() {
    EventBus.emit('boot-complete');
    this.scene.start('ParkScene');
  }
}
