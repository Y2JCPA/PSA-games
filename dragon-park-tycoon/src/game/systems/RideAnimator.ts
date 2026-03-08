import * as Phaser from 'phaser';
import { BuildingDef } from '@/lib/types';

interface RideAnimation {
  objects: Phaser.GameObjects.GameObject[];
  update: (time: number) => void;
}

export class RideAnimator {
  private animations: Map<string, RideAnimation> = new Map();

  addRide(scene: Phaser.Scene, buildingId: string, def: BuildingDef, px: number, py: number, pw: number, ph: number) {
    this.removeRide(buildingId);

    const cx = px + pw / 2;
    const cy = py + ph / 2;

    let anim: RideAnimation | null = null;
    switch (def.id) {
      case 'dragon_flight':
        anim = this.createDragonFlight(scene, cx, cy, pw, ph);
        break;
      case 'griffin_carousel':
        anim = this.createGriffinCarousel(scene, cx, cy, pw, ph);
        break;
      case 'sea_serpent_splash':
        anim = this.createSeaSerpent(scene, cx, cy, pw, ph);
        break;
      case 'unicorn_trail':
        anim = this.createUnicornTrail(scene, cx, cy, pw, ph);
        break;
      case 'phoenix_drop':
        anim = this.createPhoenixDrop(scene, cx, cy, pw, ph);
        break;
      case 'wyvern_whirlwind':
        anim = this.createWyvernWhirlwind(scene, cx, cy, pw, ph);
        break;
      case 'basilisk_bumper':
        anim = this.createBasiliskBumper(scene, cx, cy, pw, ph);
        break;
      case 'pegasus_swing':
        anim = this.createPegasusSwing(scene, cx, cy, pw, ph);
        break;
    }

    if (!anim) return;

    anim.objects.forEach(obj => {
      if ('setDepth' in obj) (obj as unknown as { setDepth: (v: number) => void }).setDepth(5);
    });

    this.animations.set(buildingId, anim);
  }

  removeRide(buildingId: string) {
    const anim = this.animations.get(buildingId);
    if (anim) {
      anim.objects.forEach(obj => {
        if (obj && obj.active) obj.destroy();
      });
      this.animations.delete(buildingId);
    }
  }

  update(time: number) {
    this.animations.forEach(anim => anim.update(time));
  }

  clear() {
    this.animations.forEach(anim => {
      anim.objects.forEach(obj => {
        if (obj && obj.active) obj.destroy();
      });
    });
    this.animations.clear();
  }

  // --- Dragon Flight: orbiting dragon with fire trail ---
  private createDragonFlight(scene: Phaser.Scene, cx: number, cy: number, w: number, h: number): RideAnimation {
    const objects: Phaser.GameObjects.GameObject[] = [];

    // Oval track outline
    const track = scene.add.ellipse(cx, cy, w * 0.7, h * 0.65, 0x000000, 0);
    track.setStrokeStyle(1.5, 0xff8844, 0.35);
    objects.push(track);

    // Dragon dot
    const dragon = scene.add.circle(cx, cy, 5, 0xff6600);
    objects.push(dragon);

    // Fire trail dots
    const trails: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 5; i++) {
      const t = scene.add.circle(cx, cy, 3 - i * 0.4, 0xff8800, 0.6 - i * 0.1);
      objects.push(t);
      trails.push(t);
    }

    const rx = w * 0.35;
    const ry = h * 0.3;

    return {
      objects,
      update: (time: number) => {
        const t = time * 0.002;
        dragon.x = cx + Math.cos(t) * rx;
        dragon.y = cy + Math.sin(t) * ry;

        for (let i = 0; i < trails.length; i++) {
          const delay = (i + 1) * 0.18;
          trails[i].x = cx + Math.cos(t - delay) * rx;
          trails[i].y = cy + Math.sin(t - delay) * ry;
        }
      },
    };
  }

  // --- Griffin Carousel: rotating dots with vertical bob ---
  private createGriffinCarousel(scene: Phaser.Scene, cx: number, cy: number, w: number, h: number): RideAnimation {
    const objects: Phaser.GameObjects.GameObject[] = [];

    // Center pole
    const pole = scene.add.circle(cx, cy, 4, 0xffd700);
    objects.push(pole);

    // 4 griffin dots
    const griffins: Phaser.GameObjects.Arc[] = [];
    const radius = Math.min(w, h) * 0.32;
    const colors = [0xccaa44, 0xddbb55, 0xbbaa33, 0xeedd66];
    for (let i = 0; i < 4; i++) {
      const g = scene.add.circle(cx, cy, 4, colors[i]);
      objects.push(g);
      griffins.push(g);
    }

    return {
      objects,
      update: (time: number) => {
        const t = time * 0.0015;
        for (let i = 0; i < griffins.length; i++) {
          const angle = t + (i / 4) * Math.PI * 2;
          griffins[i].x = cx + Math.cos(angle) * radius;
          griffins[i].y = cy + Math.sin(angle) * radius * 0.7 + Math.sin(time * 0.004 + i * 1.5) * 4;
        }
      },
    };
  }

  // --- Sea Serpent Splash: water + rocking boat ---
  private createSeaSerpent(scene: Phaser.Scene, cx: number, cy: number, w: number, h: number): RideAnimation {
    const objects: Phaser.GameObjects.GameObject[] = [];

    // Water area
    const water = scene.add.rectangle(cx, cy + h * 0.12, w * 0.75, h * 0.3, 0x2266cc, 0.35);
    objects.push(water);

    // Boat
    const boat = scene.add.rectangle(cx, cy, 14, 7, 0x8B4513);
    objects.push(boat);

    // Wave dots
    const waves: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 6; i++) {
      const wave = scene.add.circle(
        cx - w * 0.3 + i * w * 0.12, cy + h * 0.2, 2, 0x88ccff, 0.5
      );
      objects.push(wave);
      waves.push(wave);
    }

    return {
      objects,
      update: (time: number) => {
        const t = time * 0.002;
        boat.x = cx + Math.sin(t) * w * 0.2;
        boat.y = cy + Math.sin(t * 2) * 3;
        boat.rotation = Math.sin(t * 1.5) * 0.25;

        for (let i = 0; i < waves.length; i++) {
          waves[i].y = cy + h * 0.2 + Math.sin(time * 0.003 + i * 1.2) * 4;
        }
      },
    };
  }

  // --- Unicorn Trail: glowing dot traveling a winding path ---
  private createUnicornTrail(scene: Phaser.Scene, cx: number, cy: number, w: number, h: number): RideAnimation {
    const objects: Phaser.GameObjects.GameObject[] = [];

    // Path dots
    const steps = 10;
    const pathPoints: { x: number; y: number }[] = [];
    for (let i = 0; i < steps; i++) {
      const px = cx - w * 0.35 + (i / (steps - 1)) * w * 0.7;
      const py = cy + Math.sin(i * 0.9) * h * 0.2;
      pathPoints.push({ x: px, y: py });
      const dot = scene.add.circle(px, py, 1.5, 0xff88ff, 0.3);
      objects.push(dot);
    }

    // Glowing traveler
    const glow = scene.add.circle(cx, cy, 5, 0xff44ff, 0.9);
    objects.push(glow);

    // Sparkle behind
    const sparkle = scene.add.circle(cx, cy, 3, 0xffaaff, 0.5);
    objects.push(sparkle);

    return {
      objects,
      update: (time: number) => {
        const speed = 0.8;
        const t = ((time * 0.001 * speed) % steps);
        const idx = Math.floor(t);
        const frac = t - idx;
        const p1 = pathPoints[idx % steps];
        const p2 = pathPoints[(idx + 1) % steps];
        glow.x = p1.x + (p2.x - p1.x) * frac;
        glow.y = p1.y + (p2.y - p1.y) * frac;
        glow.setScale(0.8 + Math.sin(time * 0.006) * 0.3);

        // Sparkle follows
        const tPrev = ((time * 0.001 * speed) - 0.4 + steps * 100) % steps;
        const idx2 = Math.floor(tPrev);
        const frac2 = tPrev - idx2;
        const p3 = pathPoints[idx2 % steps];
        const p4 = pathPoints[(idx2 + 1) % steps];
        sparkle.x = p3.x + (p4.x - p3.x) * frac2;
        sparkle.y = p3.y + (p4.y - p3.y) * frac2;
      },
    };
  }

  // --- Phoenix Drop Tower: car rises slowly, drops fast ---
  private createPhoenixDrop(scene: Phaser.Scene, cx: number, cy: number, _w: number, h: number): RideAnimation {
    const objects: Phaser.GameObjects.GameObject[] = [];

    // Tower shaft
    const tower = scene.add.rectangle(cx, cy, 10, h * 0.8, 0x444444, 0.5);
    tower.setStrokeStyle(1, 0x666666, 0.5);
    objects.push(tower);

    // Car
    const car = scene.add.rectangle(cx, cy, 10, 8, 0xff6600);
    objects.push(car);

    // Landing particles
    const particles: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < 4; i++) {
      const p = scene.add.circle(cx, cy, 2.5, 0xff4400, 0);
      objects.push(p);
      particles.push(p);
    }

    const topY = cy - h * 0.35;
    const bottomY = cy + h * 0.32;
    const cycle = 3400;

    return {
      objects,
      update: (time: number) => {
        const t = time % cycle;
        let carY: number;

        if (t < 2000) {
          carY = bottomY + (topY - bottomY) * (t / 2000);
        } else if (t < 2300) {
          carY = topY;
        } else if (t < 2600) {
          const d = (t - 2300) / 300;
          carY = topY + (bottomY - topY) * d * d;
        } else {
          carY = bottomY;
        }
        car.y = carY;

        // Particle burst on landing
        const dropping = t >= 2600 && t < 3100;
        for (let i = 0; i < particles.length; i++) {
          if (dropping) {
            const pt = (t - 2600) / 500;
            particles[i].alpha = Math.max(0, 1 - pt);
            particles[i].y = bottomY - pt * 12;
            particles[i].x = cx + (i - 1.5) * (4 + pt * 10);
          } else {
            particles[i].alpha = 0;
          }
        }
      },
    };
  }

  // --- Wyvern Whirlwind: spinning arms with tips ---
  private createWyvernWhirlwind(scene: Phaser.Scene, cx: number, cy: number, w: number, h: number): RideAnimation {
    const objects: Phaser.GameObjects.GameObject[] = [];

    // Center hub
    const hub = scene.add.circle(cx, cy, 4, 0x66cc66);
    objects.push(hub);

    // Tip dots (arms implied by movement)
    const armCount = 4;
    const armLength = Math.min(w, h) * 0.35;
    const tips: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < armCount; i++) {
      const tip = scene.add.circle(cx, cy, 4, 0x44aa44);
      objects.push(tip);
      tips.push(tip);
    }

    // Midpoint dots (create visual "arms")
    const mids: Phaser.GameObjects.Arc[] = [];
    for (let i = 0; i < armCount; i++) {
      const mid = scene.add.circle(cx, cy, 2.5, 0x88ee88, 0.6);
      objects.push(mid);
      mids.push(mid);
    }

    return {
      objects,
      update: (time: number) => {
        const speedMod = 1 + 0.4 * Math.sin(time * 0.0008);
        const t = time * 0.003 * speedMod;

        for (let i = 0; i < armCount; i++) {
          const angle = t + (i / armCount) * Math.PI * 2;
          tips[i].x = cx + Math.cos(angle) * armLength;
          tips[i].y = cy + Math.sin(angle) * armLength;

          mids[i].x = cx + Math.cos(angle) * armLength * 0.55;
          mids[i].y = cy + Math.sin(angle) * armLength * 0.55;
        }
      },
    };
  }

  // --- Basilisk Bumper Carts: colored squares bouncing randomly ---
  private createBasiliskBumper(scene: Phaser.Scene, cx: number, cy: number, w: number, h: number): RideAnimation {
    const objects: Phaser.GameObjects.GameObject[] = [];

    const colors = [0xdd5555, 0x55dd55, 0x5555dd, 0xdddd55];
    const halfW = w * 0.35;
    const halfH = h * 0.35;

    interface Cart {
      obj: Phaser.GameObjects.Rectangle;
      targetX: number;
      targetY: number;
    }

    const carts: Cart[] = [];
    for (let i = 0; i < 4; i++) {
      const sx = cx + (i % 2 === 0 ? -1 : 1) * halfW * 0.5;
      const sy = cy + (i < 2 ? -1 : 1) * halfH * 0.5;
      const cart = scene.add.rectangle(sx, sy, 8, 8, colors[i]);
      objects.push(cart);
      carts.push({
        obj: cart,
        targetX: cx + (Math.random() - 0.5) * halfW * 2,
        targetY: cy + (Math.random() - 0.5) * halfH * 2,
      });
    }

    return {
      objects,
      update: (_time: number) => {
        for (const cart of carts) {
          const dx = cart.targetX - cart.obj.x;
          const dy = cart.targetY - cart.obj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 4) {
            cart.targetX = cx + (Math.random() - 0.5) * halfW * 2;
            cart.targetY = cy + (Math.random() - 0.5) * halfH * 2;
          } else {
            cart.obj.x += (dx / dist) * 0.7;
            cart.obj.y += (dy / dist) * 0.7;
          }

          // Clamp within bounds
          cart.obj.x = Phaser.Math.Clamp(cart.obj.x, cx - halfW, cx + halfW);
          cart.obj.y = Phaser.Math.Clamp(cart.obj.y, cy - halfH, cy + halfH);
        }
      },
    };
  }

  // --- Pegasus Sky Swing: pendulum seats swinging from a bar ---
  private createPegasusSwing(scene: Phaser.Scene, cx: number, cy: number, w: number, h: number): RideAnimation {
    const objects: Phaser.GameObjects.GameObject[] = [];

    // Top bar
    const bar = scene.add.rectangle(cx, cy - h * 0.28, w * 0.6, 3, 0x999999);
    objects.push(bar);

    // Seats (no chains — too complex for small scale)
    const seatCount = 4;
    const seats: Phaser.GameObjects.Arc[] = [];
    const chainLen = h * 0.35;

    for (let i = 0; i < seatCount; i++) {
      const seat = scene.add.circle(cx, cy, 4, 0xaaddff);
      objects.push(seat);
      seats.push(seat);
    }

    return {
      objects,
      update: (time: number) => {
        for (let i = 0; i < seatCount; i++) {
          const pivotX = cx - w * 0.25 + (i / (seatCount - 1)) * w * 0.5;
          const pivotY = cy - h * 0.28;
          const angle = Math.sin(time * 0.0025 + i * 0.6) * 0.55;

          seats[i].x = pivotX + Math.sin(angle) * chainLen;
          seats[i].y = pivotY + Math.cos(angle) * chainLen;
        }
      },
    };
  }
}
