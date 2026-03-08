import * as Phaser from 'phaser';
import { EventBus } from '../EventBus';
import { BuildingDef } from '@/lib/types';
import { CELL_SIZE } from '../systems/GridManager';

interface RideCamData {
  id: string;
  def: BuildingDef;
  gridX: number;
  gridY: number;
}

export class RideCamScene extends Phaser.Scene {
  private rideData!: RideCamData;
  private animObjects: Phaser.GameObjects.GameObject[] = [];
  private bgRect!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('RideCamScene');
  }

  init(data: RideCamData) {
    this.rideData = data;
  }

  create() {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Dark background
    this.bgRect = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.85);
    this.bgRect.setDepth(0);

    // Ride cam viewport area
    const camW = Math.min(w * 0.85, 600);
    const camH = Math.min(h * 0.6, 400);
    const camX = w / 2;
    const camY = h / 2 - 30;

    // Ride background
    const rideBg = this.add.rectangle(camX, camY, camW, camH, 0x1a0a2e);
    rideBg.setStrokeStyle(3, 0xffd700);
    rideBg.setDepth(1);

    // Title
    this.add.text(camX, camY - camH / 2 - 30, `${this.rideData.def.emoji} ${this.rideData.def.name}`, {
      fontSize: '28px',
      color: '#ffd700',
      fontFamily: 'MedievalSharp, cursive',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

    // Create ride-specific animation
    this.createRideAnimation(camX, camY, camW, camH);

    // Back button
    const backBtn = this.add.text(camX, camY + camH / 2 + 40, '⬅️ Back to Park', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#4a1a6b',
      padding: { x: 20, y: 10 },
      fontFamily: 'MedievalSharp, cursive',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(2);

    backBtn.on('pointerover', () => backBtn.setColor('#ffd700'));
    backBtn.on('pointerout', () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerup', () => {
      this.cleanup();
      this.scene.stop();
      EventBus.emit('exit-ride-cam');
    });

    EventBus.emit('ride-cam-opened', this.rideData);
  }

  private createRideAnimation(cx: number, cy: number, w: number, h: number) {
    const rideId = this.rideData.def.id;

    switch (rideId) {
      case 'dragon_flight':
        this.animDragonFlight(cx, cy, w, h);
        break;
      case 'griffin_carousel':
        this.animGriffinCarousel(cx, cy, w, h);
        break;
      case 'sea_serpent_splash':
        this.animSeaSerpent(cx, cy, w, h);
        break;
      case 'unicorn_trail':
        this.animUnicornTrail(cx, cy, w, h);
        break;
      case 'phoenix_drop':
        this.animPhoenixDrop(cx, cy, w, h);
        break;
      case 'wyvern_whirlwind':
        this.animWyvernWhirlwind(cx, cy, w, h);
        break;
      case 'basilisk_bumper':
        this.animBasiliskBumper(cx, cy, w, h);
        break;
      case 'pegasus_swing':
        this.animPegasusSwing(cx, cy, w, h);
        break;
      default:
        this.animDefault(cx, cy);
    }
  }

  private animDragonFlight(cx: number, cy: number, w: number, h: number) {
    // Dragons swooping in figure-8 pattern with fire trails
    const colors = [0xff4444, 0xff6622, 0xff8800];
    for (let i = 0; i < 3; i++) {
      const dragon = this.add.text(cx, cy, '🐉', { fontSize: '36px' }).setOrigin(0.5).setDepth(3);
      this.animObjects.push(dragon);

      // Fire trail particles
      const trail = this.add.circle(cx, cy, 4, colors[i], 0.6).setDepth(2);
      this.animObjects.push(trail);

      const offset = (i * Math.PI * 2) / 3;
      this.tweens.add({
        targets: dragon,
        x: { value: cx + Math.cos(offset) * w * 0.35, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' },
        y: { value: cy + Math.sin(offset * 2) * h * 0.25, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' },
        angle: { value: 360, duration: 4000, repeat: -1 },
      });

      // Trail follows dragon with delay
      this.tweens.add({
        targets: trail,
        x: { value: cx + Math.cos(offset) * w * 0.3, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 100 },
        y: { value: cy + Math.sin(offset * 2) * h * 0.2, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 100 },
        alpha: { value: 0.2, duration: 500, yoyo: true, repeat: -1 },
        scale: { value: 2, duration: 500, yoyo: true, repeat: -1 },
      });
    }

    // Fire burst effects
    this.time.addEvent({
      delay: 800,
      loop: true,
      callback: () => {
        const fireX = cx + (Math.random() - 0.5) * w * 0.6;
        const fireY = cy + (Math.random() - 0.5) * h * 0.4;
        const fire = this.add.text(fireX, fireY, '🔥', { fontSize: '20px' }).setOrigin(0.5).setDepth(3);
        this.tweens.add({
          targets: fire,
          alpha: 0,
          scale: 2,
          y: fireY - 30,
          duration: 600,
          onComplete: () => fire.destroy(),
        });
      },
    });
  }

  private animGriffinCarousel(cx: number, cy: number, _w: number, _h: number) {
    const griffins = ['🦅', '🦅', '🦅', '🦅', '🦅', '🦅'];
    const radius = 80;

    for (let i = 0; i < griffins.length; i++) {
      const angle = (i / griffins.length) * Math.PI * 2;
      const g = this.add.text(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius * 0.6, griffins[i], {
        fontSize: '28px',
      }).setOrigin(0.5).setDepth(3);
      this.animObjects.push(g);

      // Circular motion with up-down bob
      this.tweens.add({
        targets: g,
        y: g.y - 20,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 100,
      });
    }

    // Rotate the whole carousel via update
    const center = { angle: 0 };
    this.tweens.add({
      targets: center,
      angle: Math.PI * 2,
      duration: 4000,
      repeat: -1,
      onUpdate: () => {
        for (let i = 0; i < griffins.length; i++) {
          const a = center.angle + (i / griffins.length) * Math.PI * 2;
          const g = this.animObjects[i] as Phaser.GameObjects.Text;
          if (g && g.active) {
            g.x = cx + Math.cos(a) * radius;
          }
        }
      },
    });

    // Center pole
    const pole = this.add.circle(cx, cy, 10, 0xffd700).setDepth(2);
    this.animObjects.push(pole);
  }

  private animSeaSerpent(cx: number, cy: number, w: number, h: number) {
    // Water background
    const water = this.add.rectangle(cx, cy + h * 0.15, w * 0.8, h * 0.3, 0x2244aa, 0.5).setDepth(2);
    this.animObjects.push(water);

    // Serpent segments
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const s = this.add.text(cx - w * 0.3 + (i * w * 0.6 / segments), cy, i === 0 ? '🐍' : '〰️', {
        fontSize: i === 0 ? '32px' : '20px',
      }).setOrigin(0.5).setDepth(3);
      this.animObjects.push(s);

      this.tweens.add({
        targets: s,
        y: cy - 30,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: i * 150,
      });
    }

    // Splash effects
    this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: () => {
        const splashX = cx + (Math.random() - 0.5) * w * 0.5;
        const splash = this.add.text(splashX, cy + h * 0.1, '💦', { fontSize: '24px' }).setOrigin(0.5).setDepth(4);
        this.tweens.add({
          targets: splash,
          y: cy - 30,
          alpha: 0,
          scale: 1.5,
          duration: 500,
          onComplete: () => splash.destroy(),
        });
      },
    });
  }

  private animUnicornTrail(cx: number, cy: number, w: number, _h: number) {
    const unicorn = this.add.text(cx - w * 0.3, cy, '🦄', { fontSize: '36px' }).setOrigin(0.5).setDepth(3);
    this.animObjects.push(unicorn);

    // Unicorn walks back and forth
    this.tweens.add({
      targets: unicorn,
      x: cx + w * 0.3,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Rainbow trail
    const colors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];
    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const sparkle = this.add.circle(unicorn.x - 15, unicorn.y + 5, 3, color, 0.8).setDepth(2);
        this.tweens.add({
          targets: sparkle,
          alpha: 0,
          scale: 0.1,
          duration: 1000,
          onComplete: () => sparkle.destroy(),
        });
      },
    });

    // Sparkle text
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        const s = this.add.text(unicorn.x + (Math.random() - 0.5) * 40, unicorn.y - 20, '✨', {
          fontSize: '16px',
        }).setOrigin(0.5).setDepth(3);
        this.tweens.add({
          targets: s,
          y: s.y - 20,
          alpha: 0,
          duration: 800,
          onComplete: () => s.destroy(),
        });
      },
    });
  }

  private animPhoenixDrop(cx: number, cy: number, _w: number, h: number) {
    const phoenix = this.add.text(cx, cy + h * 0.2, '🔥', { fontSize: '40px' }).setOrigin(0.5).setDepth(3);
    this.animObjects.push(phoenix);

    // Rise slowly, then DROP fast, repeat
    const timeline = this.tweens.chain({
      targets: phoenix,
      tweens: [
        { y: cy - h * 0.25, duration: 2000, ease: 'Sine.easeOut' },
        { y: cy - h * 0.25, duration: 500 }, // pause at top
        { y: cy + h * 0.2, duration: 300, ease: 'Bounce.easeOut' }, // DROP!
        { y: cy + h * 0.2, duration: 1000 }, // pause at bottom
      ],
      repeat: -1,
    });

    // Flame burst on landing
    this.time.addEvent({
      delay: 2800,
      loop: true,
      callback: () => {
        for (let i = 0; i < 6; i++) {
          const flame = this.add.text(
            cx + (Math.random() - 0.5) * 60,
            cy + h * 0.2,
            '🔥',
            { fontSize: '20px' }
          ).setOrigin(0.5).setDepth(3);
          this.tweens.add({
            targets: flame,
            y: flame.y - 40 - Math.random() * 30,
            x: flame.x + (Math.random() - 0.5) * 40,
            alpha: 0,
            scale: 1.5,
            duration: 600,
            onComplete: () => flame.destroy(),
          });
        }
      },
    });
  }

  private animWyvernWhirlwind(cx: number, cy: number, _w: number, _h: number) {
    const wyverns = ['🐲', '🐲', '🐲', '🐲'];
    const radius = 70;

    for (let i = 0; i < wyverns.length; i++) {
      const w = this.add.text(cx, cy, wyverns[i], { fontSize: '28px' }).setOrigin(0.5).setDepth(3);
      this.animObjects.push(w);
    }

    // Fast spinning
    const spinState = { angle: 0 };
    this.tweens.add({
      targets: spinState,
      angle: Math.PI * 2,
      duration: 1500,
      repeat: -1,
      onUpdate: () => {
        for (let i = 0; i < wyverns.length; i++) {
          const a = spinState.angle + (i / wyverns.length) * Math.PI * 2;
          const obj = this.animObjects[i] as Phaser.GameObjects.Text;
          if (obj && obj.active) {
            obj.x = cx + Math.cos(a) * radius;
            obj.y = cy + Math.sin(a) * radius * 0.6;
            obj.setScale(0.7 + Math.sin(a) * 0.3);
          }
        }
      },
    });

    // Wind effects
    this.time.addEvent({
      delay: 300,
      loop: true,
      callback: () => {
        const wind = this.add.text(cx + (Math.random() - 0.5) * 100, cy + 40, '🌪️', {
          fontSize: '16px',
        }).setOrigin(0.5).setDepth(2).setAlpha(0.6);
        this.tweens.add({
          targets: wind,
          y: wind.y - 60,
          alpha: 0,
          duration: 800,
          onComplete: () => wind.destroy(),
        });
      },
    });
  }

  private animBasiliskBumper(cx: number, cy: number, w: number, h: number) {
    const carts: Phaser.GameObjects.Text[] = [];
    const cartEmojis = ['🐲', '🐲', '🐲', '🐲'];

    for (let i = 0; i < cartEmojis.length; i++) {
      const cart = this.add.text(
        cx + (Math.random() - 0.5) * w * 0.5,
        cy + (Math.random() - 0.5) * h * 0.3,
        cartEmojis[i], { fontSize: '28px' }
      ).setOrigin(0.5).setDepth(3);
      carts.push(cart);
      this.animObjects.push(cart);

      // Random bumping movement
      this.randomBump(cart, cx, cy, w * 0.35, h * 0.2);
    }

    // Bump effects
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        const bump = this.add.text(
          cx + (Math.random() - 0.5) * w * 0.4,
          cy + (Math.random() - 0.5) * h * 0.2,
          '💥', { fontSize: '20px' }
        ).setOrigin(0.5).setDepth(4);
        this.tweens.add({
          targets: bump,
          scale: 1.5,
          alpha: 0,
          duration: 400,
          onComplete: () => bump.destroy(),
        });
      },
    });
  }

  private randomBump(obj: Phaser.GameObjects.Text, cx: number, cy: number, rx: number, ry: number) {
    this.tweens.add({
      targets: obj,
      x: cx + (Math.random() - 0.5) * rx * 2,
      y: cy + (Math.random() - 0.5) * ry * 2,
      duration: 400 + Math.random() * 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (obj.active) this.randomBump(obj, cx, cy, rx, ry);
      },
    });
  }

  private animPegasusSwing(cx: number, cy: number, _w: number, h: number) {
    // Top bar
    const bar = this.add.rectangle(cx, cy - h * 0.2, 120, 6, 0x888888).setDepth(2);
    this.animObjects.push(bar);

    // Swinging pegasus seats
    const seats = ['🪽', '🪽', '🪽', '🪽'];
    for (let i = 0; i < seats.length; i++) {
      const xOffset = (i - 1.5) * 30;
      const chain = this.add.line(0, 0, cx + xOffset, cy - h * 0.2, cx + xOffset, cy + 20, 0xaaaaaa).setDepth(2);
      this.animObjects.push(chain);

      const seat = this.add.text(cx + xOffset, cy + 20, seats[i], { fontSize: '24px' }).setOrigin(0.5).setDepth(3);
      this.animObjects.push(seat);

      // Swing motion
      const swingRadius = 40 + i * 10;
      const pivotX = cx + xOffset;
      const pivotY = cy - h * 0.2;

      this.tweens.add({
        targets: { angle: -0.5 },
        angle: 0.5,
        duration: 1500 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: (_tween: Phaser.Tweens.Tween, target: { angle: number }) => {
          if (seat.active) {
            seat.x = pivotX + Math.sin(target.angle) * swingRadius;
            seat.y = pivotY + Math.cos(target.angle) * swingRadius + 30;
            // Update chain
            if (chain.active) {
              chain.setTo(pivotX, pivotY, seat.x, seat.y);
            }
          }
        },
      });
    }
  }

  private animDefault(cx: number, cy: number) {
    const text = this.add.text(cx, cy, this.rideData.def.emoji, { fontSize: '48px' }).setOrigin(0.5).setDepth(3);
    this.animObjects.push(text);
    this.tweens.add({
      targets: text,
      scale: 1.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private cleanup() {
    this.animObjects.forEach(obj => {
      if (obj && obj.active) obj.destroy();
    });
    this.animObjects = [];
    this.tweens.killAll();
    this.time.removeAllEvents();
  }

  shutdown() {
    this.cleanup();
  }
}
