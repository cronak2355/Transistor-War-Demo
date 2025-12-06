"use client";

import { useEffect, useRef } from "react";

// ============================================
// 타입 정의
// ============================================
interface Unit extends Phaser.GameObjects.Container {
  hp: number;
  maxHp: number;
  damage: number;
  faction: "legacy" | "modern";
  range: number;
  unitType: "warrior" | "ranger" | "healer" | "boss";
  cost: number;
  isMoving: boolean;
  lastAttackTime: number;
  healCooldown?: number;
  sprite?: Phaser.GameObjects.Sprite;
  hpBar?: Phaser.GameObjects.Rectangle;
}

interface Skill {
  name: string;
  description: string;
  icon: string;
  effect: (scene: GameSceneImpl, userFaction: "legacy" | "modern") => void;
}

// ============================================
// 유닛 스탯 테이블 (기획서 기준)
// ============================================
const UNIT_STATS = {
  legacy: {
    warrior: { cost: 25, hp: 25, damage: 20, range: 1 },
    ranger: { cost: 45, hp: 15, damage: 30, range: 3 },
    healer: { cost: 40, hp: 20, damage: 0, range: 2 },
    boss: { cost: 300, hp: 250, damage: 60, range: 1 },
  },
  modern: {
    warrior: { cost: 20, hp: 20, damage: 15, range: 1 },
    ranger: { cost: 40, hp: 10, damage: 25, range: 3 },
    healer: { cost: 35, hp: 15, damage: 0, range: 2 },
    boss: { cost: 250, hp: 200, damage: 50, range: 1 },
  },
};

// ============================================
// 게임 상수
// ============================================
const GAME_WIDTH = 1200;
const GAME_HEIGHT = 600;
const FIELD_WIDTH = 1000;
const FIELD_START_X = 100;
const FIELD_END_X = 1100;
const UNIT_SPEED = FIELD_WIDTH / 4;
const UNIT_SIZE = 50;
const ATTACK_INTERVAL = 500;
const MAX_ELECTRICITY = 500;
const ELECTRICITY_REGEN = 50;
const BASE_HP = 50;
const BOSS_UNLOCK_DEATHS = 20;

// 스프라이트 설정 (piskel 에셋)
const SPRITE_CONFIG = {
  frameWidth: 32,  // 프레임 크기 (확인 필요)
  frameHeight: 32,
  animFrames: 4,   // 애니메이션 프레임 수 (확인 필요)
  legacy: {
    warrior: "/legacy/LegacyWarrior.png",
    ranger: "/legacy/LegacyRanger.png",
    healer: "/legacy/LegacyHealer.png",
    boss: "/legacy/LegacyBoss.png",
  },
  modern: {
    warrior: "/modern/ModernWarrior.png",
    ranger: "/modern/ModernRanger.png",
    healer: "/modern/ModernHealer.png",
    boss: "/modern/ModernBoss.png",
  },
};

// GameSceneImpl 전방 선언
declare class GameSceneImpl extends Phaser.Scene {
  playerElectricity: number;
  aiElectricity: number;
  playerMaxElectricity: number;
  aiMaxElectricity: number;
  playerElectricityPaused: boolean;
  aiElectricityPaused: boolean;
  playerCostMultiplier: number;
  aiCostMultiplier: number;
  globalFreeze: boolean;
  getUnits(): Unit[];
  showSkillEffect(message: string, color?: number, duration?: number): void;
  createScreenFlash(color: number, duration: number): void;
  createExplosionEffect(x: number, y: number): void;
}

// ============================================
// 스킬 정의 (시각 효과 대폭 강화)
// ============================================
const createSkills = (): Skill[] => [
  {
    name: "EMP",
    description: "필드의 모든 캐릭터를 죽인다",
    icon: "⚡",
    effect: (scene) => {
      // 화면 전체 플래시
      scene.createScreenFlash(0x00ffff, 500);
      
      // 모든 유닛에 폭발 효과
      const units = scene.getUnits();
      units.forEach((unit) => {
        scene.createExplosionEffect(unit.x, unit.y);
      });
      
      // 잠시 후 유닛 제거
      scene.time.delayedCall(200, () => {
        scene.getUnits().forEach((unit) => unit.destroy());
      });
      
      scene.showSkillEffect("⚡ EMP ⚡\n모든 유닛 제거!", 0x00ffff, 2000);
    },
  },
  {
    name: "파워 서플라이 강화",
    description: "5초간 최대 전기 1000W",
    icon: "🔋",
    effect: (scene, userFaction) => {
      scene.createScreenFlash(0xffff00, 300);
      
      if (userFaction === "legacy") {
        scene.playerMaxElectricity = 1000;
        scene.time.delayedCall(5000, () => {
          scene.playerMaxElectricity = MAX_ELECTRICITY;
          scene.showSkillEffect("파워 서플라이 종료", 0x888888, 1000);
        });
      } else {
        scene.aiMaxElectricity = 1000;
        scene.time.delayedCall(5000, () => {
          scene.aiMaxElectricity = MAX_ELECTRICITY;
        });
      }
      scene.showSkillEffect("🔋 파워 서플라이 강화! 🔋\n5초간 최대 1000W", 0xffff00, 2000);
    },
  },
  {
    name: "오버 클럭",
    description: "10초간 0.1초에 10W 충전",
    icon: "⚙️",
    effect: (scene, userFaction) => {
      scene.createScreenFlash(0xff6600, 300);
      
      let pulseCount = 0;
      scene.time.addEvent({
        delay: 100,
        callback: () => {
          if (userFaction === "legacy") {
            scene.playerElectricity = Math.min(
              scene.playerElectricity + 10,
              scene.playerMaxElectricity
            );
          } else {
            scene.aiElectricity = Math.min(
              scene.aiElectricity + 10,
              scene.aiMaxElectricity
            );
          }
          pulseCount++;
          if (pulseCount % 10 === 0) {
            scene.createScreenFlash(0xff6600, 100);
          }
        },
        repeat: 99,
      });
      scene.showSkillEffect("⚙️ 오버 클럭! ⚙️\n10초간 급속 충전", 0xff6600, 2000);
    },
  },
  {
    name: "오버플로우",
    description: "상대 전기를 절반으로 줄인다",
    icon: "💥",
    effect: (scene, userFaction) => {
      scene.createScreenFlash(0xff0000, 400);
      
      if (userFaction === "legacy") {
        const before = scene.aiElectricity;
        scene.aiElectricity = Math.floor(scene.aiElectricity / 2);
        scene.showSkillEffect(`💥 오버플로우! 💥\n적 전기 ${before}W → ${scene.aiElectricity}W`, 0xff0000, 2500);
      } else {
        const before = scene.playerElectricity;
        scene.playerElectricity = Math.floor(scene.playerElectricity / 2);
        scene.showSkillEffect(`💥 오버플로우! 💥\n내 전기 ${before}W → ${scene.playerElectricity}W`, 0xff0000, 2500);
      }
    },
  },
  {
    name: "커널 패닉",
    description: "상대 전기 생성 2초 중지",
    icon: "🔴",
    effect: (scene, userFaction) => {
      scene.createScreenFlash(0x880000, 300);
      
      if (userFaction === "legacy") {
        scene.aiElectricityPaused = true;
        scene.time.delayedCall(2000, () => {
          scene.aiElectricityPaused = false;
          scene.showSkillEffect("적 전기 생성 재개", 0x888888, 1000);
        });
      } else {
        scene.playerElectricityPaused = true;
        scene.time.delayedCall(2000, () => {
          scene.playerElectricityPaused = false;
        });
      }
      scene.showSkillEffect("🔴 커널 패닉! 🔴\n상대 전기 생성 2초 중지", 0xff0000, 2000);
    },
  },
  {
    name: "캐시 부스트",
    description: "10초간 소환 코스트 절반",
    icon: "💾",
    effect: (scene, userFaction) => {
      scene.createScreenFlash(0x00ff00, 300);
      
      if (userFaction === "legacy") {
        scene.playerCostMultiplier = 0.5;
        scene.time.delayedCall(10000, () => {
          scene.playerCostMultiplier = 1;
          scene.showSkillEffect("캐시 부스트 종료", 0x888888, 1000);
        });
      } else {
        scene.aiCostMultiplier = 0.5;
        scene.time.delayedCall(10000, () => {
          scene.aiCostMultiplier = 1;
        });
      }
      scene.showSkillEffect("💾 캐시 부스트! 💾\n10초간 소환 비용 50%", 0x00ff00, 2000);
    },
  },
  {
    name: "해킹",
    description: "상대 전기의 절반을 훔친다",
    icon: "🔓",
    effect: (scene, userFaction) => {
      scene.createScreenFlash(0x00ff88, 400);
      
      if (userFaction === "legacy") {
        const stolen = Math.floor(scene.aiElectricity / 2);
        scene.aiElectricity -= stolen;
        scene.playerElectricity = Math.min(
          scene.playerElectricity + stolen,
          scene.playerMaxElectricity
        );
        scene.showSkillEffect(`🔓 해킹 성공! 🔓\n${stolen}W 획득!`, 0x00ff88, 2500);
      } else {
        const stolen = Math.floor(scene.playerElectricity / 2);
        scene.playerElectricity -= stolen;
        scene.aiElectricity = Math.min(
          scene.aiElectricity + stolen,
          scene.aiMaxElectricity
        );
        scene.showSkillEffect(`🔓 해킹 당함! 🔓\n${stolen}W 손실!`, 0xff0000, 2500);
      }
    },
  },
  {
    name: "블루 스크린",
    description: "3초간 모든 캐릭터 정지",
    icon: "🖥️",
    effect: (scene) => {
      // 블루스크린 효과
      const blueScreen = scene.add.rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x0000aa,
        0.7
      );
      blueScreen.setDepth(100);
      
      const errorText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 
        ":(\n\n시스템 오류 발생\n모든 유닛이 정지되었습니다.\n\n3초 후 재개됩니다...", {
        fontSize: "24px",
        color: "#ffffff",
        align: "center",
      }).setOrigin(0.5).setDepth(101);
      
      scene.globalFreeze = true;
      scene.getUnits().forEach((unit) => {
        if (unit.body) {
          (unit.body as Phaser.Physics.Arcade.Body).setVelocity(0);
        }
      });
      
      scene.time.delayedCall(3000, () => {
        scene.globalFreeze = false;
        blueScreen.destroy();
        errorText.destroy();
        scene.showSkillEffect("시스템 재개", 0x00ff00, 1000);
      });
    },
  },
];

export default function GamePage() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || gameInstanceRef.current) return;

    import("phaser").then((PhaserModule) => {
      const Phaser = PhaserModule.default;
      const SKILLS = createSkills();

      const isUnit = (obj: Phaser.GameObjects.GameObject): obj is Unit => {
        return "faction" in obj && "hp" in obj && "unitType" in obj;
      };

      // ============================================
      // 게임 씬 구현
      // ============================================
      class GameSceneImpl extends Phaser.Scene {
        playerElectricity = MAX_ELECTRICITY;
        aiElectricity = MAX_ELECTRICITY;
        playerMaxElectricity = MAX_ELECTRICITY;
        aiMaxElectricity = MAX_ELECTRICITY;
        playerElectricityPaused = false;
        aiElectricityPaused = false;
        playerCostMultiplier = 1;
        aiCostMultiplier = 1;

        legacyBaseHP = BASE_HP;
        modernBaseHP = BASE_HP;

        playerDeaths = 0;
        aiDeaths = 0;

        gameOver = false;
        globalFreeze = false;

        playerSkill: Skill | null = null;
        aiSkill: Skill | null = null;
        playerSkillUsed = false;
        aiSkillUsed = false;

        private playerElectricityText!: Phaser.GameObjects.Text;
        private aiElectricityText!: Phaser.GameObjects.Text;
        private legacyHPBar!: Phaser.GameObjects.Rectangle;
        private modernHPBar!: Phaser.GameObjects.Rectangle;
        private legacyHPText!: Phaser.GameObjects.Text;
        private modernHPText!: Phaser.GameObjects.Text;
        private playerDeathText!: Phaser.GameObjects.Text;
        private playerSkillBtn!: Phaser.GameObjects.Container;
        private bossButton!: Phaser.GameObjects.Container;
        private skillEffectContainer!: Phaser.GameObjects.Container;
        private assetsLoaded = false;

        constructor() {
          super("GameScene");
        }

        preload() {
          // 에셋 로드 에러 핸들링
          this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.log('에셋 로드 실패:', file.key);
          });

          // Legacy 유닛 스프라이트 로드 시도
          Object.entries(SPRITE_CONFIG.legacy).forEach(([type, path]) => {
            this.load.spritesheet(`legacy-${type}`, path, {
              frameWidth: type === 'boss' ? 64 : SPRITE_CONFIG.frameWidth,
              frameHeight: type === 'boss' ? 64 : SPRITE_CONFIG.frameHeight,
            });
          });

          // Modern 유닛 스프라이트 로드 시도
          Object.entries(SPRITE_CONFIG.modern).forEach(([type, path]) => {
            this.load.spritesheet(`modern-${type}`, path, {
              frameWidth: type === 'boss' ? 64 : SPRITE_CONFIG.frameWidth,
              frameHeight: type === 'boss' ? 64 : SPRITE_CONFIG.frameHeight,
            });
          });
        }

        create() {
          this.cameras.main.setBackgroundColor(0x0a0a0a);

          // 애니메이션 생성 (로드된 에셋만)
          this.createAnimations();

          // 랜덤 스킬 배정
          this.playerSkill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
          this.aiSkill = SKILLS[Math.floor(Math.random() * SKILLS.length)];

          this.createBackground();
          this.createUI();
          this.setupTimers();
          this.setupAI();
        }

        createAnimations() {
          const factions = ['legacy', 'modern'] as const;
          const types = ['warrior', 'ranger', 'healer', 'boss'] as const;
          
          factions.forEach(faction => {
            types.forEach(type => {
              const key = `${faction}-${type}`;
              if (this.textures.exists(key)) {
                this.assetsLoaded = true;
                const frameCount = this.textures.get(key).frameTotal - 1;
                
                // 걷기 애니메이션
                this.anims.create({
                  key: `${key}-walk`,
                  frames: this.anims.generateFrameNumbers(key, { 
                    start: 0, 
                    end: Math.min(3, frameCount) 
                  }),
                  frameRate: 8,
                  repeat: -1,
                });
                
                // 공격 애니메이션 (프레임이 충분한 경우)
                if (frameCount >= 7) {
                  this.anims.create({
                    key: `${key}-attack`,
                    frames: this.anims.generateFrameNumbers(key, { start: 4, end: 7 }),
                    frameRate: 10,
                    repeat: 0,
                  });
                }
              }
            });
          });
        }

        createBackground() {
          // 필드 영역
          const field = this.add.graphics();
          field.fillStyle(0x1a1a1a, 0.8);
          field.fillRect(FIELD_START_X, 200, FIELD_WIDTH, 200);
          
          // 그리드 라인
          field.lineStyle(1, 0x333333, 0.3);
          for (let x = FIELD_START_X; x <= FIELD_END_X; x += UNIT_SIZE) {
            field.lineBetween(x, 200, x, 400);
          }
          for (let y = 200; y <= 400; y += 50) {
            field.lineBetween(FIELD_START_X, y, FIELD_END_X, y);
          }
        }

        createUI() {
          // 제목
          this.add.text(GAME_WIDTH / 2, 25, "⚡ TRANSISTOR WAR ⚡", {
            fontSize: "32px",
            color: "#ff6600",
            fontFamily: "Courier New",
            stroke: "#000",
            strokeThickness: 4,
          }).setOrigin(0.5);

          // 기지
          this.createBase(60, 300, "legacy");
          this.createBase(1140, 300, "modern");

          // HP 바 배경
          this.add.rectangle(60, 420, 80, 12, 0x333333);
          this.legacyHPBar = this.add.rectangle(60, 420, 80, 12, 0xff4500);
          this.legacyHPText = this.add.text(60, 438, `${this.legacyBaseHP}`, {
            fontSize: "14px",
            color: "#ff4500",
          }).setOrigin(0.5);

          this.add.rectangle(1140, 420, 80, 12, 0x333333);
          this.modernHPBar = this.add.rectangle(1140, 420, 80, 12, 0x00bfff);
          this.modernHPText = this.add.text(1140, 438, `${this.modernBaseHP}`, {
            fontSize: "14px",
            color: "#00bfff",
          }).setOrigin(0.5);

          // 전기 표시
          this.add.rectangle(100, 60, 160, 40, 0x222222, 0.8);
          this.playerElectricityText = this.add.text(30, 60, `⚡ ${this.playerElectricity}W`, {
            fontSize: "24px",
            color: "#ffd700",
            fontFamily: "Courier New",
          }).setOrigin(0, 0.5);

          this.add.rectangle(1100, 60, 160, 40, 0x222222, 0.8);
          this.aiElectricityText = this.add.text(1170, 60, `⚡ ${this.aiElectricity}W`, {
            fontSize: "24px",
            color: "#ffd700",
            fontFamily: "Courier New",
          }).setOrigin(1, 0.5);

          // 사망 카운트
          this.playerDeathText = this.add.text(30, 90, `💀 ${this.playerDeaths}/${BOSS_UNLOCK_DEATHS}`, {
            fontSize: "16px",
            color: "#ff6666",
          });

          // 스킬 효과 컨테이너
          this.skillEffectContainer = this.add.container(GAME_WIDTH / 2, 130);
          this.skillEffectContainer.setDepth(50);

          this.createSummonButtons();
        }

        createBase(x: number, y: number, faction: "legacy" | "modern") {
          const color = faction === "legacy" ? 0xff4500 : 0x00bfff;
          const container = this.add.container(x, y);

          const glow = this.add.rectangle(0, 0, 75, 165, color, 0.2);
          container.add(glow);

          const base = this.add.rectangle(0, 0, 60, 150, color, 0.9);
          base.setStrokeStyle(2, 0xffffff, 0.3);
          container.add(base);

          this.tweens.add({
            targets: glow,
            alpha: 0.05,
            scaleX: 1.1,
            scaleY: 1.05,
            duration: 1500,
            yoyo: true,
            repeat: -1,
          });

          const label = this.add.text(0, 0, faction === "legacy" ? "L" : "M", {
            fontSize: "36px",
            color: "#fff",
            fontFamily: "Courier New",
          }).setOrigin(0.5);
          container.add(label);
        }

        createSummonButtons() {
          const stats = UNIT_STATS.legacy;
          const startY = 460;

          // 패널 배경
          this.add.rectangle(100, startY + 70, 180, 220, 0x111111, 0.95)
            .setStrokeStyle(2, 0xff4500, 0.8);

          this.add.text(100, startY - 10, "[ 유닛 소환 ]", {
            fontSize: "14px",
            color: "#ff4500",
          }).setOrigin(0.5);

          this.createUnitButton(100, startY + 25, "⚔️ 근접", stats.warrior.cost, "warrior");
          this.createUnitButton(100, startY + 65, "🏹 원거리", stats.ranger.cost, "ranger");
          this.createUnitButton(100, startY + 105, "💚 힐러", stats.healer.cost, "healer");
          
          this.bossButton = this.createUnitButton(100, startY + 145, "👑 보스", stats.boss.cost, "boss");
          this.bossButton.setAlpha(0.3);

          this.createSkillButton();
        }

        createUnitButton(x: number, y: number, label: string, cost: number, unitType: string): Phaser.GameObjects.Container {
          const container = this.add.container(x, y);
          
          const bg = this.add.rectangle(0, 0, 160, 32, 0x2a2a2a);
          bg.setStrokeStyle(1, 0x444444);
          container.add(bg);

          const text = this.add.text(-65, 0, label, {
            fontSize: "14px",
            color: "#fff",
          }).setOrigin(0, 0.5);
          container.add(text);

          const costText = this.add.text(65, 0, `${cost}W`, {
            fontSize: "14px",
            color: "#ffd700",
          }).setOrigin(1, 0.5);
          container.add(costText);

          bg.setInteractive({ useHandCursor: true });
          
          bg.on("pointerover", () => {
            bg.setFillStyle(0x444444);
            bg.setStrokeStyle(2, 0xff4500);
          });
          
          bg.on("pointerout", () => {
            bg.setFillStyle(0x2a2a2a);
            bg.setStrokeStyle(1, 0x444444);
          });
          
          bg.on("pointerdown", () => {
            this.spawnUnit("legacy", unitType as "warrior" | "ranger" | "healer" | "boss");
            this.tweens.add({
              targets: container,
              scaleX: 0.9,
              scaleY: 0.9,
              duration: 50,
              yoyo: true,
            });
          });

          return container;
        }

        createSkillButton() {
          const x = GAME_WIDTH / 2;
          const y = 560;

          this.playerSkillBtn = this.add.container(x, y);

          // 글로우 배경
          const glow = this.add.rectangle(0, 0, 300, 65, 0xffaa00, 0.15);
          this.playerSkillBtn.add(glow);

          this.tweens.add({
            targets: glow,
            alpha: 0.05,
            scaleX: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
          });

          const bg = this.add.rectangle(0, 0, 280, 55, 0x332200, 0.95);
          bg.setStrokeStyle(2, 0xffaa00);
          this.playerSkillBtn.add(bg);

          const icon = this.add.text(-125, 0, this.playerSkill?.icon || "🎯", {
            fontSize: "28px",
          }).setOrigin(0.5);
          this.playerSkillBtn.add(icon);

          const nameText = this.add.text(0, -10, this.playerSkill?.name || "", {
            fontSize: "18px",
            color: "#ffcc00",
            fontFamily: "Courier New",
          }).setOrigin(0.5);
          this.playerSkillBtn.add(nameText);

          const descText = this.add.text(0, 12, this.playerSkill?.description || "", {
            fontSize: "11px",
            color: "#aaa",
          }).setOrigin(0.5);
          this.playerSkillBtn.add(descText);

          const useText = this.add.text(125, 0, "[CLICK]", {
            fontSize: "10px",
            color: "#666",
          }).setOrigin(0.5);
          this.playerSkillBtn.add(useText);

          bg.setInteractive({ useHandCursor: true });
          
          bg.on("pointerover", () => {
            if (!this.playerSkillUsed) {
              bg.setStrokeStyle(3, 0xffff00);
              glow.setAlpha(0.3);
            }
          });
          
          bg.on("pointerout", () => {
            bg.setStrokeStyle(2, 0xffaa00);
            glow.setAlpha(0.15);
          });
          
          bg.on("pointerdown", () => {
            if (!this.playerSkillUsed) {
              this.usePlayerSkill();
            }
          });
        }

        setupTimers() {
          this.time.addEvent({ delay: 1000, callback: () => this.regenElectricity(), loop: true });
          this.time.addEvent({ delay: ATTACK_INTERVAL, callback: () => this.processCombat(), loop: true });
          this.time.addEvent({ delay: 1000, callback: () => this.processHealing(), loop: true });
          this.time.addEvent({ delay: 100, callback: () => this.checkBaseReach(), loop: true });
          this.time.addEvent({ delay: 50, callback: () => this.updateMovement(), loop: true });
          this.time.addEvent({ delay: 100, callback: () => this.updateUI(), loop: true });
        }

        setupAI() {
          const aiSummon = () => {
            if (this.gameOver) return;
            this.aiSummonUnit();
            this.time.delayedCall(1500 + Math.random() * 1500, aiSummon);
          };
          this.time.delayedCall(2000, aiSummon);

          // AI 스킬 사용 (15~35초 사이)
          this.time.delayedCall(15000 + Math.random() * 20000, () => {
            if (!this.aiSkillUsed && this.aiSkill) {
              this.aiSkill.effect(this, "modern");
              this.aiSkillUsed = true;
            }
          });
        }

        regenElectricity() {
          if (this.gameOver) return;
          
          if (!this.playerElectricityPaused) {
            this.playerElectricity = Math.min(this.playerElectricity + ELECTRICITY_REGEN, this.playerMaxElectricity);
          }
          if (!this.aiElectricityPaused) {
            this.aiElectricity = Math.min(this.aiElectricity + ELECTRICITY_REGEN, this.aiMaxElectricity);
          }
        }

        spawnUnit(faction: "legacy" | "modern", unitType: "warrior" | "ranger" | "healer" | "boss") {
          if (this.gameOver || this.globalFreeze) return;

          const stats = UNIT_STATS[faction][unitType];
          const costMultiplier = faction === "legacy" ? this.playerCostMultiplier : this.aiCostMultiplier;
          const actualCost = Math.floor(stats.cost * costMultiplier);

          const electricity = faction === "legacy" ? this.playerElectricity : this.aiElectricity;
          if (electricity < actualCost) return;

          if (unitType === "boss") {
            const deaths = faction === "legacy" ? this.playerDeaths : this.aiDeaths;
            if (deaths < BOSS_UNLOCK_DEATHS) return;
          }

          if (faction === "legacy") {
            this.playerElectricity -= actualCost;
          } else {
            this.aiElectricity -= actualCost;
          }

          const x = faction === "legacy" ? FIELD_START_X + 40 : FIELD_END_X - 40;
          const y = 250 + Math.random() * 100;

          const unit = this.add.container(x, y) as Unit;
          
          const spriteKey = `${faction}-${unitType}`;
          if (this.textures.exists(spriteKey)) {
            const sprite = this.add.sprite(0, 0, spriteKey);
            if (this.anims.exists(`${spriteKey}-walk`)) {
              sprite.play(`${spriteKey}-walk`);
            }
            if (faction === "modern") sprite.setFlipX(true);
            unit.add(sprite);
            unit.sprite = sprite;
          } else {
            // 기본 그래픽 (에셋 없을 때)
            const graphics = this.add.graphics();
            const color = faction === "legacy" ? 0xff4500 : 0x00bfff;
            const size = unitType === "boss" ? 25 : 12;

            if (unitType === "warrior") {
              graphics.fillStyle(color);
              graphics.fillCircle(0, 0, size);
              graphics.lineStyle(2, 0xffffff, 0.4);
              graphics.strokeCircle(0, 0, size);
            } else if (unitType === "ranger") {
              graphics.fillStyle(color);
              const dir = faction === "legacy" ? 1 : -1;
              graphics.fillTriangle(-size * dir, size, size * dir, size, 0, -size);
            } else if (unitType === "healer") {
              graphics.fillStyle(0x32cd32);
              graphics.fillRect(-size, -size, size * 2, size * 2);
              graphics.fillStyle(0xffffff);
              graphics.fillRect(-2, -size + 2, 4, size * 2 - 4);
              graphics.fillRect(-size + 2, -2, size * 2 - 4, 4);
            } else if (unitType === "boss") {
              graphics.fillStyle(color);
              graphics.fillCircle(0, 0, size);
              graphics.lineStyle(4, 0xffd700);
              graphics.strokeCircle(0, 0, size + 4);
              // 왕관
              graphics.fillStyle(0xffd700);
              graphics.fillTriangle(-10, -size - 8, 0, -size - 20, 10, -size - 8);
            }
            unit.add(graphics);
          }

          // HP 바
          const hpBarBg = this.add.rectangle(0, -28, 30, 5, 0x333333);
          const hpBar = this.add.rectangle(0, -28, 30, 5, 0x00ff00);
          unit.add(hpBarBg);
          unit.add(hpBar);
          unit.hpBar = hpBar;

          this.add.existing(unit);
          this.physics.add.existing(unit);

          unit.hp = stats.hp;
          unit.maxHp = stats.hp;
          unit.damage = stats.damage;
          unit.faction = faction;
          unit.range = stats.range;
          unit.unitType = unitType;
          unit.cost = stats.cost;
          unit.isMoving = true;
          unit.lastAttackTime = 0;
          if (unitType === "healer") unit.healCooldown = 0;

          const velocity = faction === "legacy" ? UNIT_SPEED : -UNIT_SPEED;
          (unit.body as Phaser.Physics.Arcade.Body).setVelocityX(velocity);

          this.createSpawnEffect(x, y, faction);
        }

        createSpawnEffect(x: number, y: number, faction: "legacy" | "modern") {
          const color = faction === "legacy" ? 0xff4500 : 0x00bfff;
          
          for (let i = 0; i < 3; i++) {
            const circle = this.add.circle(x, y, 5 + i * 10, color, 0.5 - i * 0.15);
            this.tweens.add({
              targets: circle,
              scale: 2,
              alpha: 0,
              duration: 300 + i * 100,
              onComplete: () => circle.destroy(),
            });
          }
        }

        aiSummonUnit() {
          if (this.gameOver) return;

          const canSummonBoss = this.aiDeaths >= BOSS_UNLOCK_DEATHS;
          const types: Array<"warrior" | "ranger" | "healer"> = ["warrior", "ranger", "healer"];

          if (canSummonBoss && this.aiElectricity >= 250 && Math.random() < 0.15) {
            this.spawnUnit("modern", "boss");
            return;
          }

          const affordable = types.filter((type) => {
            const cost = Math.floor(UNIT_STATS.modern[type].cost * this.aiCostMultiplier);
            return this.aiElectricity >= cost;
          });

          if (affordable.length > 0) {
            const type = affordable[Math.floor(Math.random() * affordable.length)];
            this.spawnUnit("modern", type);
          }
        }

        getUnits(): Unit[] {
          return this.children.list.filter(isUnit) as Unit[];
        }

        updateMovement() {
          if (this.gameOver || this.globalFreeze) return;

          const units = this.getUnits();

          for (const unit of units) {
            if (!unit.body) continue;

            const enemies = units.filter((u) => u.faction !== unit.faction);
            let nearestDist = Infinity;

            for (const enemy of enemies) {
              const dist = Math.abs(unit.x - enemy.x);
              if (dist < nearestDist) nearestDist = dist;
            }

            const attackRange = unit.range * UNIT_SIZE;

            if (nearestDist <= attackRange) {
              (unit.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
              unit.isMoving = false;
            } else {
              const velocity = unit.faction === "legacy" ? UNIT_SPEED : -UNIT_SPEED;
              (unit.body as Phaser.Physics.Arcade.Body).setVelocityX(velocity);
              unit.isMoving = true;
            }
          }
        }

        processCombat() {
          if (this.gameOver || this.globalFreeze) return;

          const units = this.getUnits();
          const currentTime = this.time.now;
          const toDestroy: Unit[] = [];

          for (const attacker of units) {
            if (attacker.damage <= 0 || toDestroy.includes(attacker)) continue;
            if (currentTime - attacker.lastAttackTime < ATTACK_INTERVAL) continue;

            const enemies = units.filter(
              (u) => u.faction !== attacker.faction && !toDestroy.includes(u) &&
                Math.abs(u.x - attacker.x) <= attacker.range * UNIT_SIZE
            );

            if (enemies.length === 0) continue;

            // 공격 수행
            if (attacker.unitType === "boss") {
              enemies.forEach((enemy) => {
                enemy.hp = 0;
                if (!toDestroy.includes(enemy)) toDestroy.push(enemy);
                this.createHitEffect(enemy.x, enemy.y, true);
              });
            } else {
              const target = enemies.reduce((nearest, e) =>
                Math.abs(e.x - attacker.x) < Math.abs(nearest.x - attacker.x) ? e : nearest
              );
              target.hp -= attacker.damage;
              this.createHitEffect(target.x, target.y, false);
              
              if (target.hp <= 0 && !toDestroy.includes(target)) {
                toDestroy.push(target);
              }
            }
            attacker.lastAttackTime = currentTime;
          }

          toDestroy.forEach((unit) => {
            if (unit.faction === "legacy") this.playerDeaths++;
            else this.aiDeaths++;
            this.createDeathEffect(unit.x, unit.y, unit.faction);
            unit.destroy();
          });
        }

        createHitEffect(x: number, y: number, isBoss: boolean) {
          const text = this.add.text(x, y - 15, isBoss ? "💀" : "💥", { fontSize: isBoss ? "20px" : "14px" });
          this.tweens.add({
            targets: text,
            y: y - 40,
            alpha: 0,
            duration: 400,
            onComplete: () => text.destroy(),
          });
        }

        createDeathEffect(x: number, y: number, faction: "legacy" | "modern") {
          const color = faction === "legacy" ? 0xff4500 : 0x00bfff;
          
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const particle = this.add.circle(x, y, 4, color, 0.8);
            
            this.tweens.add({
              targets: particle,
              x: x + Math.cos(angle) * 40,
              y: y + Math.sin(angle) * 40 - 20,
              alpha: 0,
              scale: 0.3,
              duration: 400,
              onComplete: () => particle.destroy(),
            });
          }
        }

        processHealing() {
          if (this.gameOver || this.globalFreeze) return;

          const units = this.getUnits();

          for (const healer of units) {
            if (healer.unitType !== "healer") continue;

            const allies = units.filter(
              (u) => u.faction === healer.faction && u !== healer && u.hp < u.maxHp &&
                Math.abs(u.x - healer.x) <= healer.range * UNIT_SIZE
            );

            if (allies.length > 0) {
              const target = allies.reduce((lowest, u) => u.hp < lowest.hp ? u : lowest);
              target.hp = Math.min(target.hp + 1, target.maxHp);
              
              // 힐 이펙트
              const heal = this.add.text(target.x, target.y - 20, "+1", {
                fontSize: "12px",
                color: "#00ff00",
                fontFamily: "Courier New",
              }).setOrigin(0.5);
              
              this.tweens.add({
                targets: heal,
                y: target.y - 40,
                alpha: 0,
                duration: 600,
                onComplete: () => heal.destroy(),
              });
            }
          }
        }

        checkBaseReach() {
          if (this.gameOver) return;

          const units = this.getUnits();

          for (const unit of units) {
            if (unit.faction === "legacy" && unit.x >= FIELD_END_X) {
              this.modernBaseHP--;
              this.createBaseHitEffect(1140, 300, "modern");
              unit.destroy();
            } else if (unit.faction === "modern" && unit.x <= FIELD_START_X) {
              this.legacyBaseHP--;
              this.createBaseHitEffect(60, 300, "legacy");
              unit.destroy();
            }
          }

          if (this.legacyBaseHP <= 0) this.endGame("Modern 승리! 💙");
          else if (this.modernBaseHP <= 0) this.endGame("Legacy 승리! 🧡");
        }

        createBaseHitEffect(x: number, y: number, faction: "legacy" | "modern") {
          this.cameras.main.shake(150, 0.015);
          
          const color = faction === "legacy" ? 0xff4500 : 0x00bfff;
          const flash = this.add.rectangle(x, y, 100, 200, color, 0.6);
          
          this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => flash.destroy(),
          });
        }

        updateUI() {
          this.playerElectricityText.setText(`⚡ ${this.playerElectricity}W`);
          this.aiElectricityText.setText(`⚡ ${this.aiElectricity}W`);
          
          this.playerElectricityText.setColor(this.playerElectricityPaused ? "#ff0000" : "#ffd700");

          const legacyRatio = Math.max(0, this.legacyBaseHP / BASE_HP);
          const modernRatio = Math.max(0, this.modernBaseHP / BASE_HP);
          this.legacyHPBar.setScale(legacyRatio, 1);
          this.modernHPBar.setScale(modernRatio, 1);
          this.legacyHPText.setText(`${Math.max(0, this.legacyBaseHP)}`);
          this.modernHPText.setText(`${Math.max(0, this.modernBaseHP)}`);

          this.playerDeathText.setText(`💀 ${this.playerDeaths}/${BOSS_UNLOCK_DEATHS}`);
          
          if (this.playerDeaths >= BOSS_UNLOCK_DEATHS && this.bossButton.alpha < 1) {
            this.bossButton.setAlpha(1);
            // 보스 해금 알림
            this.showSkillEffect("👑 보스 소환 가능!", 0xffd700, 1500);
          }

          if (this.playerSkillUsed) {
            this.playerSkillBtn.setAlpha(0.3);
          }

          // 유닛 HP 바 업데이트
          this.getUnits().forEach((unit) => {
            if (unit.hpBar) {
              const ratio = Math.max(0, unit.hp / unit.maxHp);
              unit.hpBar.setScale(ratio, 1);
              unit.hpBar.setFillStyle(ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000);
            }
          });
        }

        usePlayerSkill() {
          if (this.playerSkillUsed || !this.playerSkill) return;
          this.playerSkill.effect(this, "legacy");
          this.playerSkillUsed = true;
        }

        showSkillEffect(message: string, color: number = 0x00ff00, duration: number = 2000) {
          this.skillEffectContainer.removeAll(true);

          const bg = this.add.rectangle(0, 0, 350, 70, 0x000000, 0.85);
          bg.setStrokeStyle(3, color);
          this.skillEffectContainer.add(bg);

          const text = this.add.text(0, 0, message, {
            fontSize: "18px",
            color: `#${color.toString(16).padStart(6, '0')}`,
            align: "center",
            fontFamily: "Courier New",
            lineSpacing: 5,
          }).setOrigin(0.5);
          this.skillEffectContainer.add(text);

          this.skillEffectContainer.setScale(0.3);
          this.skillEffectContainer.setAlpha(0);
          
          this.tweens.add({
            targets: this.skillEffectContainer,
            scale: 1,
            alpha: 1,
            duration: 250,
            ease: "Back.easeOut",
          });

          this.time.delayedCall(duration, () => {
            this.tweens.add({
              targets: this.skillEffectContainer,
              scale: 0.8,
              alpha: 0,
              duration: 300,
              ease: "Power2",
            });
          });
        }

        createScreenFlash(color: number, duration: number) {
          const flash = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            color, 0.6
          );
          flash.setDepth(99);

          this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: duration,
            onComplete: () => flash.destroy(),
          });
        }

        createExplosionEffect(x: number, y: number) {
          const colors = [0xff0000, 0xff6600, 0xffff00, 0xffffff];
          
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const dist = 30 + Math.random() * 30;
            const particle = this.add.circle(x, y, 4 + Math.random() * 4, color);
            
            this.tweens.add({
              targets: particle,
              x: x + Math.cos(angle) * dist,
              y: y + Math.sin(angle) * dist,
              alpha: 0,
              scale: 0,
              duration: 300 + Math.random() * 200,
              onComplete: () => particle.destroy(),
            });
          }
        }

        endGame(message: string) {
          this.gameOver = true;

          this.getUnits().forEach((unit) => {
            if (unit.body) (unit.body as Phaser.Physics.Arcade.Body).setVelocity(0);
          });

          const overlay = this.add.rectangle(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            GAME_WIDTH, GAME_HEIGHT,
            0x000000, 0.85
          );
          overlay.setDepth(200);

          const color = message.includes("Legacy") ? "#ff4500" : "#00bfff";
          
          const resultText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, message, {
            fontSize: "48px",
            color: color,
            stroke: "#000",
            strokeThickness: 6,
            fontFamily: "Courier New",
          }).setOrigin(0.5).setDepth(201);

          // 결과 애니메이션
          resultText.setScale(0.5);
          this.tweens.add({
            targets: resultText,
            scale: 1,
            duration: 500,
            ease: "Back.easeOut",
          });

          const restartBtn = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
          restartBtn.setDepth(201);

          const btnBg = this.add.rectangle(0, 0, 200, 50, 0x333333);
          btnBg.setStrokeStyle(2, 0x666666);
          restartBtn.add(btnBg);

          const btnText = this.add.text(0, 0, "🔄 다시 시작", {
            fontSize: "20px",
            color: "#fff",
          }).setOrigin(0.5);
          restartBtn.add(btnText);

          btnBg.setInteractive({ useHandCursor: true });
          btnBg.on("pointerover", () => btnBg.setStrokeStyle(3, 0xffffff));
          btnBg.on("pointerout", () => btnBg.setStrokeStyle(2, 0x666666));
          btnBg.on("pointerdown", () => this.scene.restart());
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current!,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        physics: {
          default: "arcade",
          arcade: { debug: false },
        },
        scene: GameSceneImpl,
        backgroundColor: "#050505",
      };

      gameInstanceRef.current = new Phaser.Game(config);
    });

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="text-center py-3 bg-gradient-to-r from-orange-900 via-gray-900 to-cyan-900 text-white text-xl font-bold border-b-2 border-orange-600">
        ⚡ Transistor War ⚡
      </div>
      <div ref={gameRef} className="flex-1 flex justify-center items-start pt-2" />
      <div className="text-center py-2 bg-gray-900 text-gray-500 text-xs border-t border-gray-800">
        유닛 소환: 좌측 버튼 | 보스: 💀 20회 후 해금 | 스킬: 하단 중앙 (1회만)
      </div>
    </div>
  );
}