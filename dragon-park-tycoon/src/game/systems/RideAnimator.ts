import * as Phaser from 'phaser';
import { BuildingDef } from '@/lib/types';

const RIDE_TEXTURE_MAP: Record<string, string> = {
  dragon_flight: 'ride_dragon_flight',
  griffin_carousel: 'ride_griffin_carousel',
  sea_serpent_splash: 'ride_sea_serpent',
  unicorn_trail: 'ride_unicorn_trail',
  phoenix_drop: 'ride_phoenix_drop',
  wyvern_whirlwind: 'ride_wyvern_whirlwind',
  basilisk_bumper: 'ride_basilisk_bumper',
  pegasus_swing: 'ride_pegasus_swing',
  chimera_chase: 'ride_chimera_chase',
  ice_golem_coaster: 'ride_ice_golem_coaster',
  shadow_steed: 'ride_shadow_steed',
  volcano_wyrm: 'ride_volcano_wyrm',
  thunderbird_launch: 'ride_thunderbird_launch',
  elder_dragon: 'ride_elder_dragon',
};

type AnimatedDisplayObject = Phaser.GameObjects.Image | Phaser.GameObjects.Text;

interface RideAnimation {
  objects: Phaser.GameObjects.GameObject[];
  update: (time: number) => void;
  level: number;
}

export class RideAnimator {
  private animations: Map<string, RideAnimation> = new Map();

  addRide(scene: Phaser.Scene, buildingId: string, def: BuildingDef, px: number, py: number, pw: number, ph: number, level: number = 1) {
    this.removeRide(buildingId);

    const cx = px + pw / 2;
    const cy = py + ph / 2;
    const textureKey = RIDE_TEXTURE_MAP[def.id];

    const sprite: AnimatedDisplayObject = textureKey && scene.textures.exists(textureKey)
      ? scene.add.image(cx, cy, textureKey)
      : scene.add.text(cx, cy, def.emoji, {
          fontSize: `${Math.max(24, Math.min(pw, ph) * 0.55)}px`,
        }).setOrigin(0.5);
    const scale = Math.min(pw / 32, ph / 32) * 0.85;
    sprite.setScale(scale * (1 + (level - 1) * 0.12));
    sprite.setDepth(5);

    const objects: Phaser.GameObjects.GameObject[] = [sprite];

    // Level 2+ glow
    if (level >= 2) {
      const glow = scene.add.circle(cx, cy, Math.min(pw, ph) * 0.45, def.color, 0.15);
      glow.setDepth(4);
      objects.push(glow);
    }

    // Level 3 sparkle dots
    const sparkles: Phaser.GameObjects.Arc[] = [];
    if (level >= 3) {
      for (let i = 0; i < 4; i++) {
        const sp = scene.add.circle(cx, cy, 2, 0xffd700, 0);
        sp.setDepth(6);
        objects.push(sp);
        sparkles.push(sp);
      }
    }

    let updateFn: (time: number) => void;

    switch (def.id) {
      case 'dragon_flight':
        updateFn = this.makeDragonUpdate(sprite, cx, cy, pw, ph, sparkles);
        break;
      case 'griffin_carousel':
        updateFn = this.makeCarouselUpdate(sprite, cx, cy, sparkles);
        break;
      case 'sea_serpent_splash':
        updateFn = this.makeSerpentUpdate(sprite, cx, cy, pw, sparkles);
        break;
      case 'unicorn_trail':
        updateFn = this.makeUnicornUpdate(sprite, cx, cy, pw, sparkles);
        break;
      case 'phoenix_drop':
        updateFn = this.makePhoenixUpdate(sprite, cx, cy, ph, sparkles);
        break;
      case 'wyvern_whirlwind':
        updateFn = this.makeWhirlwindUpdate(sprite, cx, cy, sparkles);
        break;
      case 'basilisk_bumper':
        updateFn = this.makeBumperUpdate(sprite, cx, cy, sparkles);
        break;
      case 'pegasus_swing':
        updateFn = this.makeSwingUpdate(sprite, cx, cy, sparkles);
        break;
      case 'chimera_chase':
        updateFn = this.makeChimeraUpdate(sprite, cx, cy, pw, ph, sparkles);
        break;
      case 'ice_golem_coaster':
        updateFn = this.makeIceGolemUpdate(sprite, cx, cy, pw, sparkles);
        break;
      case 'shadow_steed':
        updateFn = this.makeShadowSteedUpdate(sprite, cx, cy, sparkles);
        break;
      case 'volcano_wyrm':
        updateFn = this.makeVolcanoWyrmUpdate(sprite, cx, cy, pw, ph, sparkles);
        break;
      case 'thunderbird_launch':
        updateFn = this.makeThunderbirdUpdate(sprite, cx, cy, ph, sparkles);
        break;
      case 'elder_dragon':
        updateFn = this.makeElderDragonUpdate(sprite, cx, cy, pw, ph, sparkles);
        break;
      default:
        updateFn = () => {};
    }

    this.animations.set(buildingId, { objects, update: updateFn, level });
  }

  removeRide(buildingId: string) {
    const anim = this.animations.get(buildingId);
    if (anim) {
      anim.objects.forEach(obj => { if (obj && obj.active) obj.destroy(); });
      this.animations.delete(buildingId);
    }
  }

  update(time: number) {
    this.animations.forEach(anim => anim.update(time));
  }

  clear() {
    this.animations.forEach(anim => {
      anim.objects.forEach(obj => { if (obj && obj.active) obj.destroy(); });
    });
    this.animations.clear();
  }

  private updateSparkles(sparkles: Phaser.GameObjects.Arc[], cx: number, cy: number, radius: number, time: number) {
    for (let i = 0; i < sparkles.length; i++) {
      const a = time * 0.003 + (i / sparkles.length) * Math.PI * 2;
      sparkles[i].x = cx + Math.cos(a) * radius;
      sparkles[i].y = cy + Math.sin(a) * radius;
      sparkles[i].alpha = 0.5 + Math.sin(time * 0.008 + i) * 0.5;
    }
  }

  private makeDragonUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, w: number, h: number, sparkles: Phaser.GameObjects.Arc[]) {
    const rx = w * 0.2, ry = h * 0.15;
    return (time: number) => {
      const t = time * 0.002;
      sprite.x = cx + Math.cos(t) * rx;
      sprite.y = cy + Math.sin(t) * ry;
      sprite.rotation = Math.sin(t) * 0.3;
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy, Math.min(w, h) * 0.4, time);
    };
  }

  private makeCarouselUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, sparkles: Phaser.GameObjects.Arc[]) {
    return (time: number) => {
      sprite.rotation = time * 0.0015;
      sprite.y = cy + Math.sin(time * 0.003) * 3;
      sprite.x = cx;
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy, 30, time);
    };
  }

  private makeSerpentUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, w: number, sparkles: Phaser.GameObjects.Arc[]) {
    return (time: number) => {
      sprite.x = cx + Math.sin(time * 0.002) * w * 0.08;
      sprite.y = cy + Math.sin(time * 0.004) * 2;
      sprite.rotation = Math.sin(time * 0.003) * 0.15;
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy, 25, time);
    };
  }

  private makeUnicornUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, w: number, sparkles: Phaser.GameObjects.Arc[]) {
    const baseScale = sprite.scaleX;
    return (time: number) => {
      sprite.x = cx + Math.sin(time * 0.0015) * w * 0.12;
      sprite.y = cy + Math.sin(time * 0.003) * 3;
      sprite.setScale(baseScale + Math.sin(time * 0.005) * baseScale * 0.05);
      if (sparkles.length) this.updateSparkles(sparkles, sprite.x, sprite.y, 20, time);
    };
  }

  private makePhoenixUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, h: number, sparkles: Phaser.GameObjects.Arc[]) {
    const topY = cy - h * 0.2, bottomY = cy + h * 0.15;
    const cycle = 3400;
    return (time: number) => {
      const t = time % cycle;
      if (t < 2000) sprite.y = bottomY + (topY - bottomY) * (t / 2000);
      else if (t < 2300) sprite.y = topY;
      else if (t < 2600) { const d = (t - 2300) / 300; sprite.y = topY + (bottomY - topY) * d * d; }
      else sprite.y = bottomY;
      sprite.x = cx;
      if (sparkles.length) this.updateSparkles(sparkles, cx, bottomY, 15, time);
    };
  }

  private makeWhirlwindUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, sparkles: Phaser.GameObjects.Arc[]) {
    return (time: number) => {
      const speedMod = 1 + 0.4 * Math.sin(time * 0.0008);
      sprite.rotation = time * 0.003 * speedMod;
      sprite.x = cx; sprite.y = cy;
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy, 28, time);
    };
  }

  private makeBumperUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, sparkles: Phaser.GameObjects.Arc[]) {
    return (time: number) => {
      sprite.x = cx + Math.sin(time * 0.007) * 3 + Math.sin(time * 0.013) * 2;
      sprite.y = cy + Math.cos(time * 0.009) * 3 + Math.cos(time * 0.011) * 2;
      sprite.rotation = Math.sin(time * 0.005) * 0.08;
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy, 25, time);
    };
  }

  private makeSwingUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, sparkles: Phaser.GameObjects.Arc[]) {
    return (time: number) => {
      sprite.rotation = Math.sin(time * 0.0025) * 0.2;
      sprite.x = cx + Math.sin(time * 0.0025) * 5;
      sprite.y = cy;
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy, 25, time);
    };
  }

  private makeChimeraUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, w: number, h: number, sparkles: Phaser.GameObjects.Arc[]) {
    return (time: number) => {
      const t = time * 0.0035;
      sprite.x = cx + Math.sin(t) * w * 0.12;
      sprite.y = cy + Math.sin(t * 2.1) * h * 0.08;
      sprite.rotation = Math.sin(t * 1.7) * 0.18;
      if (sparkles.length) this.updateSparkles(sparkles, sprite.x, sprite.y, 22, time);
    };
  }

  private makeIceGolemUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, w: number, sparkles: Phaser.GameObjects.Arc[]) {
    const baseScale = sprite.scaleX;
    return (time: number) => {
      const pulse = 1 + Math.sin(time * 0.004) * 0.08;
      sprite.x = cx + Math.sin(time * 0.0018) * w * 0.15;
      sprite.y = cy + Math.cos(time * 0.0036) * 2;
      sprite.setScale(baseScale * pulse);
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy, 30, time);
    };
  }

  private makeShadowSteedUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, sparkles: Phaser.GameObjects.Arc[]) {
    return (time: number) => {
      const t = time * 0.0026;
      sprite.x = cx + Math.cos(t) * 8;
      sprite.y = cy + Math.sin(t * 2) * 4;
      sprite.rotation = Math.cos(t) * 0.22;
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy, 24, time);
    };
  }

  private makeVolcanoWyrmUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, w: number, h: number, sparkles: Phaser.GameObjects.Arc[]) {
    return (time: number) => {
      const t = time * 0.0022;
      sprite.x = cx + Math.sin(t) * w * 0.1;
      sprite.y = cy + Math.abs(Math.sin(t * 1.8)) * -h * 0.12 + Math.sin(t * 7) * 1.5;
      sprite.rotation = Math.sin(t * 1.3) * 0.12;
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy + 6, 18 + Math.sin(t * 2) * 8, time);
    };
  }

  private makeThunderbirdUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, h: number, sparkles: Phaser.GameObjects.Arc[]) {
    const topY = cy - h * 0.28;
    const bottomY = cy + h * 0.2;
    const cycle = 2600;
    return (time: number) => {
      const t = time % cycle;
      if (t < 500) sprite.y = bottomY;
      else if (t < 900) sprite.y = bottomY + (topY - bottomY) * ((t - 500) / 400);
      else if (t < 1200) sprite.y = topY;
      else if (t < 1600) sprite.y = topY + (bottomY - topY) * ((t - 1200) / 400);
      else sprite.y = bottomY;
      sprite.x = cx + Math.sin(time * 0.012) * 2;
      sprite.rotation = Math.sin(time * 0.01) * 0.1;
      if (sparkles.length) this.updateSparkles(sparkles, cx, sprite.y, 16, time);
    };
  }

  private makeElderDragonUpdate(sprite: AnimatedDisplayObject, cx: number, cy: number, w: number, h: number, sparkles: Phaser.GameObjects.Arc[]) {
    const baseScale = sprite.scaleX;
    return (time: number) => {
      const t = time * 0.0015;
      sprite.x = cx + Math.cos(t) * w * 0.08;
      sprite.y = cy + Math.sin(t * 1.4) * h * 0.08;
      sprite.rotation = Math.sin(t) * 0.16;
      sprite.setScale(baseScale * (1 + Math.sin(time * 0.0045) * 0.06));
      if (sparkles.length) this.updateSparkles(sparkles, cx, cy, Math.min(w, h) * 0.45, time);
    };
  }
}
