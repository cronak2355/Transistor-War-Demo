"use client";

import { useEffect, useRef } from "react";

interface Unit extends Phaser.GameObjects.Container {
  hp: number;
  maxHp: number;
  damage: number;
  faction: "legacy" | "modern";
  range: number;
  type: "warrior" | "ranger" | "healer" | "boss";
  healCooldown?: number;
  unitCost: number; // 인스턴스 속성으로 변경
}

export default function GamePage() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    import("phaser").then((PhaserModule) => {
      const Phaser = PhaserModule.default;

      // 유닛 비용 상수
      const UNIT_COSTS = {
        warrior: 25,
        ranger: 45,
        healer: 40,
        boss: 300,
      };

      // 유닛인지 확인하는 타입 가드
      const isUnit = (obj: Phaser.GameObjects.GameObject): obj is Unit => {
        return 'faction' in obj && 'hp' in obj && 'type' in obj;
      };

      // Legacy 유닛 클래스들
      class LegacyWarrior extends Phaser.GameObjects.Container implements Unit {
        hp = 25;
        maxHp = 25;
        damage = 20;
        faction: "legacy" = "legacy";
        range = 1;
        type: "warrior" = "warrior";
        unitCost = UNIT_COSTS.warrior;

        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);
          const graphics = scene.add.graphics();
          graphics.fillStyle(0xff4500);
          graphics.fillCircle(0, 0, 15);
          this.add(graphics);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(80);
        }
      }

      class LegacyRanger extends Phaser.GameObjects.Container implements Unit {
        hp = 15;
        maxHp = 15;
        damage = 30;
        faction: "legacy" = "legacy";
        range = 3;
        type: "ranger" = "ranger";
        unitCost = UNIT_COSTS.ranger;

        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);
          const graphics = scene.add.graphics();
          graphics.fillStyle(0xff6347);
          graphics.fillTriangle(-10, 10, 10, 10, 0, -15);
          this.add(graphics);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(80);
        }
      }

      class LegacyHealer extends Phaser.GameObjects.Container implements Unit {
        hp = 20;
        maxHp = 20;
        damage = 0;
        faction: "legacy" = "legacy";
        range = 2;
        type: "healer" = "healer";
        healCooldown = 0;
        unitCost = UNIT_COSTS.healer;

        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);
          const graphics = scene.add.graphics();
          graphics.fillStyle(0x32cd32);
          graphics.fillRect(-10, -10, 20, 20);
          this.add(graphics);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(80);
        }
      }

      class LegacyBoss extends Phaser.GameObjects.Container implements Unit {
        hp = 250;
        maxHp = 250;
        damage = 60;
        faction: "legacy" = "legacy";
        range = 1;
        type: "boss" = "boss";
        unitCost = UNIT_COSTS.boss;

        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);
          const graphics = scene.add.graphics();
          graphics.fillStyle(0xff0000);
          graphics.fillCircle(0, 0, 30);
          this.add(graphics);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(60);
        }
      }

      // Modern 유닛 클래스들
      class ModernWarrior extends Phaser.GameObjects.Container implements Unit {
        hp = 20;
        maxHp = 20;
        damage = 15;
        faction: "modern" = "modern";
        range = 1;
        type: "warrior" = "warrior";
        unitCost = UNIT_COSTS.warrior;

        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);
          const graphics = scene.add.graphics();
          graphics.fillStyle(0x00ffff);
          graphics.fillCircle(0, 0, 15);
          this.add(graphics);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(-80);
        }
      }

      class ModernRanger extends Phaser.GameObjects.Container implements Unit {
        hp = 10;
        maxHp = 10;
        damage = 25;
        faction: "modern" = "modern";
        range = 3;
        type: "ranger" = "ranger";
        unitCost = UNIT_COSTS.ranger;

        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);
          const graphics = scene.add.graphics();
          graphics.fillStyle(0x00bfff);
          graphics.fillTriangle(-10, 10, 10, 10, 0, -15);
          this.add(graphics);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(-80);
        }
      }

      class ModernHealer extends Phaser.GameObjects.Container implements Unit {
        hp = 15;
        maxHp = 15;
        damage = 0;
        faction: "modern" = "modern";
        range = 2;
        type: "healer" = "healer";
        healCooldown = 0;
        unitCost = UNIT_COSTS.healer;

        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);
          const graphics = scene.add.graphics();
          graphics.fillStyle(0x00ff7f);
          graphics.fillRect(-10, -10, 20, 20);
          this.add(graphics);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(-80);
        }
      }

      class ModernBoss extends Phaser.GameObjects.Container implements Unit {
        hp = 200;
        maxHp = 200;
        damage = 50;
        faction: "modern" = "modern";
        range = 1;
        type: "boss" = "boss";
        unitCost = UNIT_COSTS.boss;

        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);
          const graphics = scene.add.graphics();
          graphics.fillStyle(0x0000ff);
          graphics.fillCircle(0, 0, 30);
          this.add(graphics);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(-60);
        }
      }

      // 상성 계산
      const getDamageMultiplier = (attackerType: string, defenderType: string): number => {
        // 예: warrior > healer > ranger > warrior
        if (attackerType === "warrior" && defenderType === "healer") return 1.5;
        if (attackerType === "healer" && defenderType === "ranger") return 1.5;
        if (attackerType === "ranger" && defenderType === "warrior") return 1.5;
        return 1.0;
      };

      class GameScene extends Phaser.Scene {
        private playerElectricity = 500;
        private aiElectricity = 500; // AI 별도 자원
        private legacyBaseHP = 50;
        private modernBaseHP = 50;
        private electricityText!: Phaser.GameObjects.Text;
        private legacyHPText!: Phaser.GameObjects.Text;
        private modernHPText!: Phaser.GameObjects.Text;
        private gameOver = false;
        private electricityTimer!: Phaser.Time.TimerEvent;

        constructor() {
          super("GameScene");
        }

        create() {
          this.cameras.main.setBackgroundColor(0x1a1a1a);
          
          // 제목
          this.add.text(600, 30, "TRANSISTOR WAR", {
            fontSize: "48px",
            color: "#ff4500",
            fontFamily: "Courier New",
            stroke: "#000",
            strokeThickness: 8
          }).setOrigin(0.5);

          // 전기 자원 타이머 (Phaser 타이머 사용)
          this.electricityText = this.add.text(50, 50, `전기: ${this.playerElectricity}W`, { 
            fontSize: "24px", 
            color: "#ffd700" 
          });

          this.electricityTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
              if (this.gameOver) return;
              this.playerElectricity += 50;
              this.aiElectricity += 50;
              this.electricityText.setText(`전기: ${this.playerElectricity}W`);
            },
            loop: true
          });

          // 기지
          this.add.rectangle(80, 300, 80, 200, 0xff4500);
          this.add.rectangle(1120, 300, 80, 200, 0x00ffff);
          
          this.legacyHPText = this.add.text(50, 100, `Legacy: ${this.legacyBaseHP}`, { 
            fontSize: "18px", 
            color: "#ff4500" 
          });
          this.modernHPText = this.add.text(1050, 100, `Modern: ${this.modernBaseHP}`, { 
            fontSize: "18px", 
            color: "#00ffff" 
          });

          // 소환 버튼
          this.createButton(50, 480, "근접 (25W)", () => this.spawnLegacy(LegacyWarrior, 25));
          this.createButton(50, 520, "원거리 (45W)", () => this.spawnLegacy(LegacyRanger, 45));
          this.createButton(50, 560, "힐러 (40W)", () => this.spawnLegacy(LegacyHealer, 40));
          this.createButton(50, 600, "보스 (300W)", () => this.spawnLegacy(LegacyBoss, 300));

          // AI 소환
          this.time.addEvent({
            delay: 2000,
            callback: () => this.aiSummon(),
            loop: true
          });

          // 전투 로직
          this.time.addEvent({
            delay: 500,
            callback: () => this.processCombat(),
            loop: true
          });

          // 힐러 로직
          this.time.addEvent({
            delay: 1000,
            callback: () => this.processHealing(),
            loop: true
          });

          // 기지 도달 체크
          this.time.addEvent({
            delay: 100,
            callback: () => this.checkBaseReach(),
            loop: true
          });
        }

        private createButton(x: number, y: number, text: string, callback: () => void) {
          const btn = this.add.text(x, y, text, { 
            fontSize: "18px", 
            color: "#fff",
            backgroundColor: "#333",
            padding: { x: 8, y: 4 }
          }).setInteractive();
          
          btn.on("pointerover", () => btn.setBackgroundColor("#555"));
          btn.on("pointerout", () => btn.setBackgroundColor("#333"));
          btn.on("pointerdown", callback);
        }

        private spawnLegacy(UnitClass: new (scene: Phaser.Scene, x: number, y: number) => Unit, cost: number) {
          if (this.gameOver || this.playerElectricity < cost) return;
          this.playerElectricity -= cost;
          this.electricityText.setText(`전기: ${this.playerElectricity}W`);
          new UnitClass(this, 150, 250 + Math.random() * 150);
        }

        private aiSummon() {
          if (this.gameOver) return;
          
          const options = [
            { Class: ModernWarrior, cost: 25 },
            { Class: ModernRanger, cost: 45 },
            { Class: ModernHealer, cost: 40 },
          ];
          
          // 보스는 가끔만
          if (this.aiElectricity >= 300 && Math.random() < 0.1) {
            this.aiElectricity -= 300;
            new ModernBoss(this, 1050, 250 + Math.random() * 150);
            return;
          }

          const affordable = options.filter(o => this.aiElectricity >= o.cost);
          if (affordable.length > 0) {
            const choice = affordable[Math.floor(Math.random() * affordable.length)];
            this.aiElectricity -= choice.cost;
            new choice.Class(this, 1050, 250 + Math.random() * 150);
          }
        }

        private getUnits(): Unit[] {
          return this.children.list.filter(isUnit);
        }

        private processCombat() {
          if (this.gameOver) return;
          
          const units = this.getUnits();
          const toDestroy: Unit[] = [];

          for (const attacker of units) {
            if (toDestroy.includes(attacker)) continue;

            for (const defender of units) {
              if (attacker === defender || attacker.faction === defender.faction) continue;
              if (toDestroy.includes(defender)) continue;

              const distance = Math.abs(attacker.x - defender.x);
              const attackRange = attacker.range * 80;

              if (distance <= attackRange && attacker.damage > 0) {
                const multiplier = getDamageMultiplier(attacker.type, defender.type);
                defender.hp -= attacker.damage * multiplier;
                
                // 양쪽이 근접이면 반격
                if (defender.range === 1 && distance <= 80) {
                  const counterMultiplier = getDamageMultiplier(defender.type, attacker.type);
                  attacker.hp -= defender.damage * counterMultiplier;
                }

                if (defender.hp <= 0) toDestroy.push(defender);
                if (attacker.hp <= 0) toDestroy.push(attacker);
              }
            }
          }

          toDestroy.forEach(u => u.destroy());
        }

        private processHealing() {
          if (this.gameOver) return;

          const units = this.getUnits();
          
          for (const healer of units) {
            if (healer.type !== "healer") continue;
            if ((healer.healCooldown ?? 0) > 0) {
              healer.healCooldown!--;
              continue;
            }

            const allies = units.filter(u => 
              u.faction === healer.faction && 
              u !== healer && 
              u.hp < u.maxHp &&
              Math.abs(u.x - healer.x) <= healer.range * 80
            );

            if (allies.length > 0) {
              const lowest = allies.reduce((min, u) => u.hp < min.hp ? u : min);
              lowest.hp = Math.min(lowest.hp + 5, lowest.maxHp);
              healer.healCooldown = 2;
            }
          }
        }

        private checkBaseReach() {
          if (this.gameOver) return;

          const units = this.getUnits();
          
          for (const unit of units) {
            if (unit.faction === "legacy" && unit.x >= 1080) {
              this.modernBaseHP -= 5;
              unit.destroy();
            } else if (unit.faction === "modern" && unit.x <= 120) {
              this.legacyBaseHP -= 5;
              unit.destroy();
            }
          }

          this.legacyHPText.setText(`Legacy: ${this.legacyBaseHP}`);
          this.modernHPText.setText(`Modern: ${this.modernBaseHP}`);

          if (this.legacyBaseHP <= 0) this.endGame("Modern 승리!");
          if (this.modernBaseHP <= 0) this.endGame("Legacy 승리!");
        }

        private endGame(message: string) {
          this.gameOver = true;
          this.electricityTimer.destroy();
          
          // 모든 유닛 정지
          this.getUnits().forEach(u => {
            if (u.body) {
              (u.body as Phaser.Physics.Arcade.Body).setVelocity(0);
            }
          });

          this.add.text(600, 300, message, {
            fontSize: "64px",
            color: message.includes("Legacy") ? "#ff4500" : "#00ffff",
            stroke: "#000",
            strokeThickness: 6
          }).setOrigin(0.5);
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: 1200,
        height: 650,
        physics: { default: "arcade" },
        scene: GameScene,
        backgroundColor: "#0a0a0a"
      };

      const game = new Phaser.Game(config);
      return () => game.destroy(true);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="text-center py-4 bg-orange-900 text-white text-2xl font-bold">
        Transistor War - Legacy vs Modern
      </div>
      <div ref={gameRef} className="flex-1" />
    </div>
  );
}