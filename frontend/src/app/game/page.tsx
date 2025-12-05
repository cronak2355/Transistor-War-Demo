// src/app/game/page.tsx (Day 2 업데이트 버전)
"use client";

import { useEffect, useRef } from "react";

export default function GamePage() {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    import("phaser").then((PhaserModule) => {
      const Phaser = PhaserModule.default;

      // Day 2: 현대 유닛 클래스 (FinFET Fighter)
      class FinFETFighter extends Phaser.GameObjects.Container {
        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);

          // 작은 현대 트랜지스터 몸통 (청록색)
          const body = scene.add.rectangle(0, 0, 30, 40, 0x00ffff).setStrokeStyle(3, 0x0080ff);
          const chip = scene.add.rectangle(0, -10, 20, 20, 0xffffff, 0.8).setStrokeStyle(2, 0x0000ff);
          const nanoEffect = scene.add.circle(0, 15, 4, 0x00ff00); // 나노 효과
          scene.tweens.add({
            targets: nanoEffect,
            scale: 1.5,
            duration: 500,
            repeat: -1,
            yoyo: true
          });

          const label = scene.add.text(0, 25, "MODERN", {
            fontSize: "12px",
            color: "#000000",
            fontStyle: "bold"
          }).setOrigin(0.5);

          this.add([body, chip, nanoEffect, label]);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(-150);  // ← 왼쪽으로 감 빠른 속도
          this.damage = 25; // 기본 데미지
          this.faction = "modern"; // 상성용
        }
      }

      // Legacy 탱커 클래스 (기존 + 상성 속성 추가)
      class VacuumTubeTanker extends Phaser.GameObjects.Container {
        constructor(scene: Phaser.Scene, x: number, y: number) {
          super(scene, x, y);
          const body = scene.add.rectangle(0, 0, 60, 100, 0xff4500).setStrokeStyle(6, 0x8b0000);
          const glass = scene.add.rectangle(0, -20, 40, 60, 0x87CEEB, 0.3).setStrokeStyle(4, 0x4682B4);
          const electron = scene.add.circle(0, 20, 8, 0x00ff00);
          scene.tweens.add({ targets: electron, y: -40, duration: 2000, repeat: -1 });
          const label = scene.add.text(0, 60, "LEGACY", { fontSize: "16px", color: "#ffffff", fontStyle: "bold" }).setOrigin(0.5);
          this.add([body, glass, electron, label]);
          scene.add.existing(this);
          scene.physics.add.existing(this);
          (this.body as Phaser.Physics.Arcade.Body).setVelocityX(80);
          this.hp = 300; // 높은 HP
          this.damage = 15; // 낮은 데미지
          this.faction = "legacy"; // 상성용
        }
      }

      // Day 2: 상성 계산 함수
      const getDamageMultiplier = (attackerFaction: string, defenderFaction: string): number => {
        if (attackerFaction === "legacy" && defenderFaction === "modern") return 1.5; // Legacy 강함
        if (attackerFaction === "modern" && defenderFaction === "legacy") return 1.5; // Modern 강함
        return 1.0; // 동급
      };

      // Day 2: 골드 시스템
      let gold = 200;
      let goldInterval: NodeJS.Timeout;

      class GameScene extends Phaser.Scene {
        create() {
          this.cameras.main.setBackgroundColor(0x1a1a1a);

          this.add.text(600, 50, "TRANSISTOR WAR", {
            fontSize: "48px",
            color: "#ff4500",
            fontFamily: "Courier New",
            stroke: "#000",
            strokeThickness: 8
          }).setOrigin(0.5);

          // 골드 UI
          const goldText = this.add.text(50, 50, `Gold: ${gold}`, { fontSize: "24px", color: "#ffd700" });

          // 골드 자동 증가 (초당 5)
          goldInterval = setInterval(() => {
            gold += 5;
            goldText.setText(`Gold: ${gold}`);
          }, 1000);

          // Legacy 탱커 생성 버튼 (왼쪽)
          this.add.text(50, 500, "Legacy Tanker (50G)", {
            fontSize: "20px",
            color: "#ff4500",
            backgroundColor: "#000000"
          }).setInteractive().setPadding(10).on("pointerdown", () => {
            if (gold >= 50) {
              gold -= 50;
              goldText.setText(`Gold: ${gold}`);
              new VacuumTubeTanker(this, 100, 300 + Math.random() * 100);
            }
          });

          // Modern Fighter 생성 버튼 (오른쪽)
        this.add.text(900, 500, "Modern Fighter (40G)", {
        fontSize: "20px",
        color: "#00ffff",
        backgroundColor: "#000000"
        }).setInteractive().setPadding(10).on("pointerdown", () => {
            if (gold >= 40) {
            gold -= 40;
            goldText.setText(`Gold: ${gold}`);
            const fighter = new FinFETFighter(this, 1100, 300 + Math.random() * 100); // 오른쪽에서 시작
            // 생성 후 바로 왼쪽으로 강제 설정
            (fighter.body as Phaser.Physics.Arcade.Body).setVelocityX(-150); // ← 생성 직후 왼쪽으로 강제 설정
        }
        });

          // 간단 충돌/상성 데모 (유닛이 만나면 데미지 계산)
          this.physics.add.collider([VacuumTubeTanker, FinFETFighter], (unit1, unit2) => {
            if (unit1.faction !== unit2.faction) {
              const multiplier = getDamageMultiplier(unit1.faction, unit2.faction);
              (unit2 as any).hp -= (unit1 as any).damage * multiplier;
              console.log(`상성 데미지: ${unit1.damage} * ${multiplier} = ${(unit1 as any).damage * multiplier}`);
              if ((unit2 as any).hp <= 0) {
                unit2.destroy();
              }
            }
          });
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: gameRef.current,
        width: 1200,
        height: 600,
        physics: { default: "arcade" },
        scene: GameScene,
        backgroundColor: "#0a0a0a"
      };

      const game = new Phaser.Game(config);

      return () => {
        game.destroy(true);
        clearInterval(goldInterval);
      };
    }).catch((error) => {
      console.error("Phaser 로드 실패:", error);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <div className="text-center py-4 bg-orange-900 text-white text-2xl font-bold">
        Transistor War - Day 2: 현대 유닛 + 상성 + 골드 완성!
      </div>
      <div ref={gameRef} className="flex-1" />
    </div>
  );
}