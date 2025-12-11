"use client";

import { gameWebSocket, GameMessage } from "@/lib/websocket"; // GameMessage import 유지 (로컬 선언 제거)
import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { GameApi, TokenManager } from "@/lib/api";

// ============================================
// 타입 정의 (로컬 GameMessage 제거: websocket.ts에서 확장 가정)
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
    warrior: { cost: 30, hp: 300, damage: 5, range: 1 },
    ranger: { cost: 50, hp: 150, damage: 30, range: 4 },
    healer: { cost: 40, hp: 200, damage: 0, range: 3 },
    boss: { cost: 300, hp: 2500, damage: 60, range: 1 },
  },
  modern: {
    warrior: { cost: 20, hp: 200, damage: 1, range: 1 },
    ranger: { cost: 40, hp: 100, damage: 25, range: 4 },
    healer: { cost: 30, hp: 150, damage: 0, range: 3 },
    boss: { cost: 250, hp: 2000, damage: 50, range: 1 },
  },
};

// ============================================
// 게임 상수
// ============================================
const GAME_WIDTH = 1400; // 화면 넓힘
const GAME_HEIGHT = 700; // 화면 높힘
const FIELD_WIDTH = 1100; // 필드 넓힘
const FIELD_START_X = 150;
const FIELD_END_X = 1250;
const UNIT_SPEED = FIELD_WIDTH / 15; // 8초에 끝에서 끝 도달 (느리게)
const UNIT_SIZE = 60; // 거리 단위 늘림
const ATTACK_INTERVAL = 1000; // 1초마다 공격 (느리게)
const MAX_ELECTRICITY = 500;
const ELECTRICITY_REGEN = 10;
const BASE_HP = 1;
const BOSS_UNLOCK_DEATHS = 0;
const SUMMON_COOLDOWN = 500; // 소환 쿨타임 0.5초


// 스프라이트 설정 (piskel 에셋)
const SPRITE_CONFIG = {
  frameWidth: 32,
  frameHeight: 32,
  animFrames: 2, // 걷기 2프레임
  unitScale: 1.8, // 일반 유닛 확대
  bossScale: 2.5, // 보스 확대
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

// 스킬 배열 (전역)
const SKILLS = createSkills();

export default function GamePage() {
  const gameRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<Phaser.Game | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
 
  // URL에서 파라미터 가져오기
  const playerFaction = (searchParams.get("faction") as "legacy" | "modern") || "legacy";
  const aiFaction = playerFaction === "legacy" ? "modern" : "legacy";
  const mode = searchParams.get("mode"); // 'single' or 'multi'
  const roomCode = searchParams.get("room");
  const isHostParam = searchParams.get("host") === "true";

  useEffect(() => {
    if (!gameRef.current || gameInstanceRef.current) return;

    // 멀티플레이어면 WebSocket 연결
    const setupMultiplayer = async () => {
      if (mode === 'multi' && roomCode) {
        try {
          await gameWebSocket.connect(roomCode, (message: GameMessage) => {
            const scene = gameInstanceRef.current?.scene.getScene('GameScene') as any;
            if (!scene) return;
           
            console.log('게임 메시지 수신:', message.type, message.data); // 디버깅 로그
           
            switch (message.type) {
              case 'SYNC_STATE':
                // 게스트: 호스트에서 받은 상태 적용
                if (!isHostParam && message.data?.gameState) {
                  scene.applyGameState(message.data.gameState);
                }
                break;
               
              case 'SPAWN_UNIT':
                // 호스트: 게스트의 소환 요청 처리
                if (isHostParam && message.data && message.data.faction !== playerFaction) {
                  scene.handleSpawnRequest(message.data.unitType, message.data.faction);
                }
                break;
               
              case 'USE_SKILL':
                // 호스트: 게스트의 스킬 요청 처리
                if (isHostParam && message.data && message.data.faction !== playerFaction) {
                  scene.handleSkillRequest(message.data.skillIndex, message.data.faction);
                }
                // 게스트: 스킬 이펙트 표시 (호스트가 쓴 스킬)
                if (!isHostParam && message.data && message.data.faction !== playerFaction) {
                  scene.showEnemySkillEffect(message.data.skillIndex);
                }
                break;

              // 수정: 타입 가드 추가 (as GameMessageType | 'GAME_OVER'로 확장)
              case 'GAME_OVER' as any: // 임시 타입 단언: websocket.ts에서 GameMessageType에 'GAME_OVER' 추가 시 제거
                console.log('GAME_OVER 메시지 수신:', message.data);
                if (!isHostParam && message.data?.winner) { // 옵셔널 체이닝 강화: winner 존재 확인
                  const isWin = message.data.winner === playerFaction;
                  scene.endGame(isWin ? "🎉 승리! 🎉" : "💀 패배 💀", isWin);
                }
                break;
            }
          });
        } catch (err) {
          console.error('WebSocket 연결 실패:', err);
        }
      }
    };

    import("phaser").then((PhaserModule) => {
      const Phaser = PhaserModule.default;

      const isUnit = (obj: Phaser.GameObjects.GameObject): obj is Unit => {
        return "faction" in obj && "hp" in obj && "unitType" in obj;
      };

      // ============================================
      // 게임 씬 구현
      // ============================================
      class GameSceneImpl extends Phaser.Scene {
        // 진영 설정
        playerFaction: "legacy" | "modern" = "legacy";
        aiFaction: "legacy" | "modern" = "modern";

        // 멀티플레이어 변수 추가
        isMultiplayer = false;
        roomCode: string | null = null;
        isHost = false; // 호스트 여부
 
        // 유닛 ID 관리
        private unitMap: Map<string, Unit> = new Map();
        private unitIdCounter = 0;
        private lastSpawnRequestTime: Map<string, number> = new Map(); // ← 추가
        // 유닛 수 제한
        private maxUnitsPerFaction = 15;
        private unitCountText!: Phaser.GameObjects.Text;
        // 오디오
        private bgm!: Phaser.Sound.BaseSound;
        private isMuted = false;
        private volumeButton!: Phaser.GameObjects.Text;
       
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
       
        // 소환 쿨타임
        lastSummonTime = 0;
       
        // 게임 시작 시간 (결과 저장용)
        gameStartTime = Date.now();

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

        init(data: { playerFaction: "legacy" | "modern"; aiFaction: "legacy" | "modern"; isMultiplayer?: boolean; roomCode?: string; isHost?: boolean }) {
          this.playerFaction = data.playerFaction || "legacy";
          this.aiFaction = data.aiFaction || "modern";
          this.isMultiplayer = data.isMultiplayer || false;
          this.roomCode = data.roomCode || null;
          this.isHost = data.isHost || false;
          this.gameStartTime = Date.now();
 
          // 유닛 맵 초기화
          this.unitMap = new Map();
          this.unitIdCounter = 0;
        }

        preload() {
          // 에셋 로드 에러 핸들링
          this.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.log('에셋 로드 실패:', file.key);
          });

          // 배경음악 로드
          this.load.audio('bgm', '/audio/Transistor_war.mp3');

          // Legacy 유닛 스프라이트 로드 시도
          Object.entries(SPRITE_CONFIG.legacy).forEach(([type, path]) => {
            this.load.spritesheet(`legacy-${type}`, path, {
              frameWidth: SPRITE_CONFIG.frameWidth,
              frameHeight: SPRITE_CONFIG.frameHeight,
            });
          });

          // Modern 유닛 스프라이트 로드 시도
          Object.entries(SPRITE_CONFIG.modern).forEach(([type, path]) => {
            this.load.spritesheet(`modern-${type}`, path, {
              frameWidth: SPRITE_CONFIG.frameWidth,
              frameHeight: SPRITE_CONFIG.frameHeight,
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
          this.setupAudio();
 
          // 멀티플레이어: 호스트만 게임 로직 실행
          if (this.isMultiplayer) {
            if (this.isHost) {
              this.setupTimers();
              // 0.1초마다 상태 동기화
              this.time.addEvent({
                delay: 100,
                callback: () => this.broadcastGameState(),
                loop: true
              });
            } else {
              // 게스트는 UI 업데이트만
              this.time.addEvent({ delay: 100, callback: () => this.updateUI(), loop: true });
            }
          } else {
            // 싱글플레이어
            this.setupTimers();
            this.setupAI();
          }
        }

        // GameSceneImpl 클래스에 추가 (init() 또는 생성자)
        private lastBroadcastOnEnd = false; // 플래그 초기화

        // 호스트: 게임 상태 브로드캐스트
        broadcastGameState() {
          if (!this.isMultiplayer || !this.isHost) return;
         
          // gameOver 시 한 번만 허용 (종료 직전 동기화)
          if (this.gameOver && this.lastBroadcastOnEnd) return;
          this.lastBroadcastOnEnd = this.gameOver;
         
          const units: any[] = [];
          this.unitMap.forEach((unit, unitId) => {
            if (unit.active) {
              units.push({
                unitId,
                unitType: unit.unitType,
                faction: unit.faction,
                x: unit.x,
                y: unit.y,
                hp: unit.hp,
                maxHp: unit.maxHp
              });
            }
          });
         
          const state = {
            legacyBaseHP: this.legacyBaseHP,
            modernBaseHP: this.modernBaseHP,
            legacyElectricity: this.playerFaction === 'legacy' ? this.playerElectricity : this.aiElectricity,
            modernElectricity: this.playerFaction === 'modern' ? this.playerElectricity : this.aiElectricity,
            units,
            legacyDeaths: this.playerFaction === 'legacy' ? this.playerDeaths : this.aiDeaths,
            modernDeaths: this.playerFaction === 'modern' ? this.playerDeaths : this.aiDeaths,
            gameOver: this.gameOver,
            winner: this.gameOver ? (this.legacyBaseHP <= 0 ? 'modern' : 'legacy') : undefined
          };
         
          gameWebSocket.syncGameState(state);
        }

        // 게스트: 상태 적용
        applyGameState(state: any) {
          if (this.isHost) return;
         
          this.legacyBaseHP = state.legacyBaseHP;
          this.modernBaseHP = state.modernBaseHP;
         
          // 전기량
          if (this.playerFaction === 'legacy') {
            this.playerElectricity = state.legacyElectricity;
            this.aiElectricity = state.modernElectricity;
            this.playerDeaths = state.legacyDeaths;
            this.aiDeaths = state.modernDeaths;
          } else {
            this.playerElectricity = state.modernElectricity;
            this.aiElectricity = state.legacyElectricity;
            this.playerDeaths = state.modernDeaths;
            this.aiDeaths = state.legacyDeaths;
          }
         
          // 유닛 동기화
          const receivedIds = new Set<string>();
         
          for (const unitData of state.units) {
            receivedIds.add(unitData.unitId);
           
            if (this.unitMap.has(unitData.unitId)) {
              // 기존 유닛 업데이트
              const unit = this.unitMap.get(unitData.unitId)!;
              unit.x = unitData.x;
              unit.y = unitData.y;
              unit.hp = unitData.hp;
            } else {
              // 새 유닛 생성
              this.createUnitFromState(unitData);
            }
          }
         
          // 서버에 없는 유닛 제거
          this.unitMap.forEach((unit, unitId) => {
            if (!receivedIds.has(unitId)) {
              this.createDeathEffect(unit.x, unit.y, unit.faction);
              unit.destroy();
              this.unitMap.delete(unitId);
            }
          });
         
          // gameOver 체크 강화: 즉시 endGame 호출 (UI 업데이트 중단)
          if (state.gameOver && !this.gameOver) {
            console.log('게스트: SYNC_STATE로 게임 오버 감지', state.winner);
            const isWin = state.winner === this.playerFaction;
            this.endGame(isWin ? "🎉 승리! 🎉" : "💀 패배 💀", isWin);
            return; // 추가: 즉시 반환하여 추가 업데이트 방지
          }
         
          this.updateUI();
        }

        // 게스트: 상태에서 유닛 생성
        createUnitFromState(data: any) {
          const faction = data.faction as "legacy" | "modern";
          const unitType = data.unitType as "warrior" | "ranger" | "healer" | "boss";
          const stats = UNIT_STATS[faction][unitType];
         
          const unit = this.add.container(data.x, data.y) as Unit;
         
          const spriteKey = `${faction}-${unitType}`;
          if (this.textures.exists(spriteKey)) {
            const sprite = this.add.sprite(0, 0, spriteKey);
            if (this.anims.exists(`${spriteKey}-walk`)) sprite.play(`${spriteKey}-walk`);
            if (faction === "modern") sprite.setFlipX(true);
            sprite.setScale(unitType === "boss" ? SPRITE_CONFIG.bossScale : SPRITE_CONFIG.unitScale);
            unit.add(sprite);
          } else {
            const graphics = this.add.graphics();
            const color = faction === "legacy" ? 0xff4500 : 0x00bfff;
            const size = unitType === "boss" ? 28 : 16;
            graphics.fillStyle(color);
            graphics.fillCircle(0, 0, size);
            unit.add(graphics);
          }
         
          const hpBarBg = this.add.rectangle(0, -35, 35, 6, 0x333333);
          const hpBar = this.add.rectangle(0, -35, 35, 6, 0x00ff00);
          unit.add(hpBarBg);
          unit.add(hpBar);
          unit.hpBar = hpBar;
         
          this.add.existing(unit);
          this.physics.add.existing(unit);
         
          unit.hp = data.hp;
          unit.maxHp = data.maxHp;
          unit.damage = stats.damage;
          unit.faction = faction;
          unit.range = stats.range;
          unit.unitType = unitType;
          unit.cost = stats.cost;
          unit.isMoving = true;
          unit.lastAttackTime = 0;
         
          this.unitMap.set(data.unitId, unit);
          this.createSpawnEffect(data.x, data.y, faction);
        }

        // 호스트: 소환 요청 처리 (중복 방지)
        handleSpawnRequest(unitType: string, faction: string) {
          if (!this.isHost) return;
         
          // 같은 진영의 중복 요청 방지 (0.3초 내 무시)
          const key = faction;
          const now = Date.now();
          const lastTime = this.lastSpawnRequestTime.get(key) || 0;
         
          if (now - lastTime < 300) {
            console.log('중복 소환 요청 무시');
            return;
          }
         
          this.lastSpawnRequestTime.set(key, now);
          this.spawnUnit(faction as "legacy" | "modern", unitType as "warrior" | "ranger" | "healer" | "boss", false);
        }

        // 호스트: 스킬 요청 처리
        handleSkillRequest(skillIndex: number, faction: string) {
          if (!this.isHost) return;
         
          // 요청 faction이 호스트와 다를 때만 처리 (자기 스킬 무시)
          if (faction === this.playerFaction) {
            console.warn('호스트: 자기 스킬 요청 무시 - 게스트 요청만 처리');
            return;
          }
 
          const skill = SKILLS[skillIndex];
          if (skill) {
            skill.effect(this, faction as "legacy" | "modern");
          }
        }

        // 상대 스킬 이펙트 표시 (게스트용)
        showEnemySkillEffect(skillIndex: number) {
          const skill = SKILLS[skillIndex];
          if (skill) {
            this.showSkillEffect(`${skill.icon} ${skill.name} ${skill.icon}\n상대가 스킬 사용!`, 0xff0000, 2000);
          }
        }

        createAnimations() {
          const factions = ['legacy', 'modern'] as const;
          const types = ['warrior', 'ranger', 'healer', 'boss'] as const;
         
          factions.forEach(faction => {
            types.forEach(type => {
              const key = `${faction}-${type}`;
              if (this.textures.exists(key)) {
                this.assetsLoaded = true;
               
                // 걷기 애니메이션 (2프레임)
                this.anims.create({
                  key: `${key}-walk`,
                  frames: this.anims.generateFrameNumbers(key, { 
                    start: 0, 
                    end: 1  // 0, 1 = 2프레임
                  }),
                  frameRate: 6,
                  repeat: -1,
                });
              }
            });
          });
        }

        createBackground() {
          // 필드 영역 - 밝은 색으로 변경
          const field = this.add.graphics();
         
          // 필드 배경 (밝은 회색-파랑 계열)
          field.fillStyle(0x3a4a5a, 0.9);
          field.fillRect(FIELD_START_X, 220, FIELD_WIDTH, 260);
         
          // 필드 테두리
          field.lineStyle(3, 0x5a6a7a, 1);
          field.strokeRect(FIELD_START_X, 220, FIELD_WIDTH, 260);
         
          // 그리드 라인 (더 밝게)
          field.lineStyle(1, 0x4a5a6a, 0.5);
          for (let x = FIELD_START_X; x <= FIELD_END_X; x += UNIT_SIZE) {
            field.lineBetween(x, 220, x, 480);
          }
          for (let y = 220; y <= 480; y += 65) {
            field.lineBetween(FIELD_START_X, y, FIELD_END_X, y);
          }
         
          // 중앙선
          field.lineStyle(2, 0x6a7a8a, 0.7);
          field.lineBetween(GAME_WIDTH / 2, 220, GAME_WIDTH / 2, 480);
        }

        createUI() {
          const isPlayerLegacy = this.playerFaction === "legacy";
         
          // 제목
          this.add.text(GAME_WIDTH / 2, 30, "⚡ TRANSISTOR WAR ⚡", {
            fontSize: "36px",
            color: "#ff6600",
            fontFamily: "Courier New",
            stroke: "#000",
            strokeThickness: 4,
          }).setOrigin(0.5);
         
          // 진영 표시
          this.add.text(GAME_WIDTH / 2, 65, `[ LEGACY vs MODERN ]`, {
            fontSize: "16px",
            color: "#888",
          }).setOrigin(0.5);

          // 기지 - Legacy=왼쪽, Modern=오른쪽 (항상 고정)
          this.createBase(80, 350, "legacy");
          this.createBase(GAME_WIDTH - 80, 350, "modern");

          // Legacy HP 바 (왼쪽) - 항상 고정
          this.add.rectangle(80, 190, 100, 16, 0x333333);
          this.legacyHPBar = this.add.rectangle(80, 190, 100, 16, 0xff4500);
          this.legacyHPText = this.add.text(80, 168, `HP: ${this.legacyBaseHP}`, {
            fontSize: "16px",
            color: "#ff4500",
          }).setOrigin(0.5);
         
          // Legacy 라벨
          this.add.text(80, 145, isPlayerLegacy ? "👤 YOU" : "🤖 AI", {
            fontSize: "12px",
            color: "#ff4500",
          }).setOrigin(0.5);

          // Modern HP 바 (오른쪽) - 항상 고정
          this.add.rectangle(GAME_WIDTH - 80, 190, 100, 16, 0x333333);
          this.modernHPBar = this.add.rectangle(GAME_WIDTH - 80, 190, 100, 16, 0x00bfff);
          this.modernHPText = this.add.text(GAME_WIDTH - 80, 168, `HP: ${this.modernBaseHP}`, {
            fontSize: "16px",
            color: "#00bfff",
          }).setOrigin(0.5);
         
          // Modern 라벨
          this.add.text(GAME_WIDTH - 80, 145, isPlayerLegacy ? "🤖 AI" : "👤 YOU", {
            fontSize: "12px",
            color: "#00bfff",
          }).setOrigin(0.5);

          // 플레이어 전기 표시 (플레이어 진영 쪽)
          const playerElecX = isPlayerLegacy ? 120 : GAME_WIDTH - 120;
          const playerTextX = isPlayerLegacy ? 40 : GAME_WIDTH - 40;
          const playerAlign = isPlayerLegacy ? 0 : 1;
          this.add.rectangle(playerElecX, 70, 180, 45, 0x222222, 0.8);
          this.playerElectricityText = this.add.text(playerTextX, 70, `⚡ ${this.playerElectricity}W`, {
            fontSize: "26px",
            color: "#ffd700",
            fontFamily: "Courier New",
          }).setOrigin(playerAlign, 0.5);

          // AI 전기 표시 (AI 진영 쪽)
          const aiElecX = isPlayerLegacy ? GAME_WIDTH - 120 : 120;
          const aiTextX = isPlayerLegacy ? GAME_WIDTH - 40 : 40;
          const aiAlign = isPlayerLegacy ? 1 : 0;
          this.add.rectangle(aiElecX, 70, 180, 45, 0x222222, 0.8);
          this.aiElectricityText = this.add.text(aiTextX, 70, `⚡ ${this.aiElectricity}W`, {
            fontSize: "26px",
            color: "#aaa",
            fontFamily: "Courier New",
          }).setOrigin(aiAlign, 0.5);

          // 사망 카운트 (플레이어 진영 쪽)
          const deathX = isPlayerLegacy ? 40 : GAME_WIDTH - 200;
          this.playerDeathText = this.add.text(deathX, 105, `💀 ${this.playerDeaths}/${BOSS_UNLOCK_DEATHS}`, {
            fontSize: "18px",
            color: "#ff6666",
          });

          // 스킬 효과 컨테이너
          this.skillEffectContainer = this.add.container(GAME_WIDTH / 2, 140);
          this.skillEffectContainer.setDepth(50);

          this.createSummonButtons();
        }

        setupAudio() {
          const scene = this as any;
          
          try {
            if (scene.cache.audio.exists('bgm')) {
              this.bgm = scene.sound.add('bgm', {
                volume: 0.3,
                loop: true
              });
              
              // 바로 재생 시도
              const playPromise = this.bgm.play();
              
              // 자동 재생 실패하면 클릭 시 재생
              if (scene.sound.locked) {
                console.log('오디오 잠김 - 클릭 대기');
                scene.sound.once('unlocked', () => {
                  console.log('오디오 잠금 해제됨');
                  if (this.bgm && !this.isMuted) {
                    this.bgm.play();
                  }
                });
              }
            }
          } catch (e) {
            console.error('오디오 초기화 실패:', e);
          }
          
          // 볼륨 버튼 생성
          this.volumeButton = this.add.text(GAME_WIDTH - 50, 30, '🔊', {
            fontSize: '28px',
          }).setOrigin(0.5).setInteractive({ useHandCursor: true });
          
          this.volumeButton.on('pointerdown', () => {
            // 음악 안 나오면 여기서 시작
            if (this.bgm && !(this.bgm as any).isPlaying && !this.isMuted) {
              this.bgm.play();
            }
            this.toggleMute();
          });
          
          this.volumeButton.on('pointerover', () => {
            this.volumeButton.setScale(1.2);
          });
          
          this.volumeButton.on('pointerout', () => {
            this.volumeButton.setScale(1);
          });
        }

        toggleMute() {
          this.isMuted = !this.isMuted;
          
          if (this.bgm) {
            const bgm = this.bgm as any;
            if (this.isMuted) {
              bgm.pause();
              this.volumeButton.setText('🔇');
            } else {
              bgm.resume();
              this.volumeButton.setText('🔊');
            }
          }
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
          const stats = UNIT_STATS[this.playerFaction];
          const isPlayerLegacy = this.playerFaction === "legacy";
          const panelColor = isPlayerLegacy ? 0xff4500 : 0x00bfff;
          const textColor = isPlayerLegacy ? "#ff4500" : "#00bfff";
         
          // 소환 버튼은 플레이어 진영 쪽에 위치
          const startX = isPlayerLegacy ? 120 : GAME_WIDTH - 120;
          const startY = 510;

          // 패널 배경
          this.add.rectangle(startX, startY + 60, 200, 200, 0x111111, 0.95)
            .setStrokeStyle(2, panelColor, 0.8);

          this.add.text(startX, startY - 10, `[ ${this.playerFaction.toUpperCase()} 유닛 ]`, {
            fontSize: "16px",
            color: textColor,
          }).setOrigin(0.5);
         
          // 쿨타임 안내
          this.add.text(startX, startY + 145, "쿨타임: 0.5초", {
            fontSize: "11px",
            color: "#666",
          }).setOrigin(0.5);

          this.createUnitButton(startX, startY + 20, "⚔️ 근접", stats.warrior.cost, "warrior");
          this.createUnitButton(startX, startY + 55, "🏹 원거리", stats.ranger.cost, "ranger");
          this.createUnitButton(startX, startY + 90, "💚 힐러", stats.healer.cost, "healer");
         
          // 보스 버튼
          this.bossButton = this.createUnitButton(startX, startY + 125, "👑 보스", stats.boss.cost, "boss");
          this.bossButton.setAlpha(0.3);

          this.createSkillButton();
        }

        createUnitButton(x: number, y: number, label: string, cost: number, unitType: string): Phaser.GameObjects.Container {
          const container = this.add.container(x, y);
         
          const bg = this.add.rectangle(0, 0, 175, 32, 0x2a2a2a);
          bg.setStrokeStyle(1, 0x444444);
          container.add(bg);

          const text = this.add.text(-75, 0, label, {
            fontSize: "15px",
            color: "#fff",
          }).setOrigin(0, 0.5);
          container.add(text);

          const costText = this.add.text(75, 0, `${cost}W`, {
            fontSize: "15px",
            color: "#ffd700",
          }).setOrigin(1, 0.5);
          container.add(costText);

          bg.setInteractive({ useHandCursor: true });
         
          bg.on("pointerover", () => {
            // 보스는 조건 충족 시에만 하이라이트
            if (unitType === "boss" && this.playerDeaths < BOSS_UNLOCK_DEATHS) return;
            bg.setFillStyle(0x444444);
            bg.setStrokeStyle(2, 0xff4500);
          });
         
          bg.on("pointerout", () => {
            bg.setFillStyle(0x2a2a2a);
            bg.setStrokeStyle(1, 0x444444);
          });
         
          bg.on("pointerdown", () => {
            // 쿨타임 체크
            const now = this.time.now;
            if (now - this.lastSummonTime < SUMMON_COOLDOWN) {
              return;
            }
           
            // 보스 조건 체크
            if (unitType === "boss" && this.playerDeaths < BOSS_UNLOCK_DEATHS) {
              this.showSkillEffect(`💀 ${BOSS_UNLOCK_DEATHS - this.playerDeaths}명 더 사망 필요!`, 0xff6666, 1500);
              return;
            }
           
            // 멀티플레이어 처리
            if (this.isMultiplayer) {
              if (this.isHost) {
                // 호스트: 직접 소환
                const success = this.spawnUnit(this.playerFaction, unitType as "warrior" | "ranger" | "healer" | "boss");
                if (success) this.lastSummonTime = now;
              } else {
                // 게스트: 소환 요청
                gameWebSocket.requestSpawn(unitType, this.playerFaction);
                this.lastSummonTime = now;
              }
            } else {
              // 싱글플레이어
              const success = this.spawnUnit(this.playerFaction, unitType as "warrior" | "ranger" | "healer" | "boss");
              if (success) this.lastSummonTime = now;
            }
           
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
          const y = 640;

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
          if (this.isMultiplayer) return;
          const aiSummon = () => {
            if (this.gameOver) return;
            this.aiSummonUnit();
            this.time.delayedCall(2000 + Math.random() * 2000, aiSummon); // 2~4초 간격
          };
          this.time.delayedCall(3000, aiSummon); // 3초 후 시작

          // AI 스킬 사용 (20~40초 사이)
          this.time.delayedCall(20000 + Math.random() * 20000, () => {
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

        spawnUnit(faction: "legacy" | "modern", unitType: "warrior" | "ranger" | "healer" | "boss", fromNetwork = false): boolean {
          if (this.gameOver || this.globalFreeze) return false;
          
          // 유닛 수 제한 체크
          const currentUnits = this.getUnits().filter(u => u.faction === faction).length;
          if (currentUnits >= this.maxUnitsPerFaction) {
            if (faction === this.playerFaction) {
              this.showSkillEffect(`⚠️ 최대 ${this.maxUnitsPerFaction}유닛!`, 0xff6666, 1000);
            }
            return false;
          }

          const isPlayer = faction === this.playerFaction;
          const stats = UNIT_STATS[faction][unitType];
          const costMultiplier = isPlayer ? this.playerCostMultiplier : this.aiCostMultiplier;
          const actualCost = Math.floor(stats.cost * costMultiplier);

          const electricity = isPlayer ? this.playerElectricity : this.aiElectricity;
          if (electricity < actualCost) return false;

          if (unitType === "boss") {
            const deaths = isPlayer ? this.playerDeaths : this.aiDeaths;
            if (deaths < BOSS_UNLOCK_DEATHS) return false;
          }

          if (isPlayer) {
            this.playerElectricity -= actualCost;
          } else {
            this.aiElectricity -= actualCost;
          }

          // Legacy=왼쪽에서 스폰, Modern=오른쪽에서 스폰 (항상 고정)
          const isLegacy = faction === "legacy";
          const x = isLegacy ? FIELD_START_X + 50 : FIELD_END_X - 50;
          const y = 280 + Math.random() * 140;

          const unit = this.add.container(x, y) as Unit;
         
          const spriteKey = `${faction}-${unitType}`;
          if (this.textures.exists(spriteKey)) {
            const sprite = this.add.sprite(0, 0, spriteKey);
            if (this.anims.exists(`${spriteKey}-walk`)) {
              sprite.play(`${spriteKey}-walk`);
            }
            // Modern 유닛은 왼쪽으로 이동하므로 flip
            if (!isLegacy) sprite.setFlipX(true);
            // 스케일 적용
            const scale = unitType === "boss" ? SPRITE_CONFIG.bossScale : SPRITE_CONFIG.unitScale;
            sprite.setScale(scale);
            unit.add(sprite);
            unit.sprite = sprite;
          } else {
            // 기본 그래픽 (에셋 없을 때)
            const graphics = this.add.graphics();
            const color = faction === "legacy" ? 0xff4500 : 0x00bfff;
            const size = unitType === "boss" ? 28 : 16;

            if (unitType === "warrior") {
              graphics.fillStyle(color);
              graphics.fillCircle(0, 0, size);
              graphics.lineStyle(2, 0xffffff, 0.4);
              graphics.strokeCircle(0, 0, size);
            } else if (unitType === "ranger") {
              graphics.fillStyle(color);
              // Legacy=오른쪽 향함, Modern=왼쪽 향함
              const dir = isLegacy ? 1 : -1;
              graphics.fillTriangle(-size * dir, size, size * dir, size, 0, -size);
            } else if (unitType === "healer") {
              graphics.fillStyle(0x32cd32);
              graphics.fillRect(-size, -size, size * 2, size * 2);
              graphics.fillStyle(0xffffff);
              graphics.fillRect(-3, -size + 3, 6, size * 2 - 6);
              graphics.fillRect(-size + 3, -3, size * 2 - 6, 6);
            } else if (unitType === "boss") {
              graphics.fillStyle(color);
              graphics.fillCircle(0, 0, size);
              graphics.lineStyle(4, 0xffd700);
              graphics.strokeCircle(0, 0, size + 5);
              // 왕관
              graphics.fillStyle(0xffd700);
              graphics.fillTriangle(-12, -size - 10, 0, -size - 25, 12, -size - 10);
            }
            unit.add(graphics);
          }

          // HP 바
          const hpBarBg = this.add.rectangle(0, -35, 35, 6, 0x333333);
          const hpBar = this.add.rectangle(0, -35, 35, 6, 0x00ff00);
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

          // Legacy=오른쪽으로 이동, Modern=왼쪽으로 이동
          const velocity = isLegacy ? UNIT_SPEED : -UNIT_SPEED;
          (unit.body as Phaser.Physics.Arcade.Body).setVelocityX(velocity);

          // 유닛 ID 생성 및 맵에 저장
          const unitId = `${faction}-${this.unitIdCounter++}-${Date.now()}`;
          this.unitMap.set(unitId, unit);

          this.createSpawnEffect(x, y, faction);

          // 멀티플레이어이고, 내가 소환한 거면 WebSocket 전송
          if (this.isMultiplayer && !fromNetwork && faction === this.playerFaction) {
            gameWebSocket.spawnUnit(unitType, faction, x, y, `${faction}-${Date.now()}`);
          }
         
          return true;
        }

        spawnEnemyUnit(unitType: string, faction: string, x: number, y: number) {
          this.spawnUnit(faction as "legacy" | "modern", unitType as "warrior" | "ranger" | "healer" | "boss", true);
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

          if (canSummonBoss && this.aiElectricity >= UNIT_STATS[this.aiFaction].boss.cost && Math.random() < 0.15) {
            this.spawnUnit(this.aiFaction, "boss");
            return;
          }

          const affordable = types.filter((type) => {
            const cost = Math.floor(UNIT_STATS[this.aiFaction][type].cost * this.aiCostMultiplier);
            return this.aiElectricity >= cost;
          });

          if (affordable.length > 0) {
            const type = affordable[Math.floor(Math.random() * affordable.length)];
            this.spawnUnit(this.aiFaction, type);
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
              // 보스: 범위 내 모든 적에게 강력한 데미지 (즉사 아님!)
              enemies.forEach((enemy) => {
                this.createHitEffect(enemy.x, enemy.y, attacker.damage, true);
                enemy.hp -= attacker.damage;
               
                if (enemy.hp <= 0 && !toDestroy.includes(enemy)) {
                  toDestroy.push(enemy);
                }
              });
            } else {
              // 일반 유닛: 가장 가까운 적 1명 공격
              const target = enemies.reduce((nearest, e) =>
                Math.abs(e.x - attacker.x) < Math.abs(nearest.x - attacker.x) ? e : nearest
              );
              // 공격 라인 이펙트
              this.createAttackLine(attacker.x, attacker.y, target.x, target.y, attacker.faction);
              this.createHitEffect(target.x, target.y, attacker.damage, false);
              target.hp -= attacker.damage;
             
              if (target.hp <= 0 && !toDestroy.includes(target)) {
                toDestroy.push(target);
              }
            }
            attacker.lastAttackTime = currentTime;

          }


          toDestroy.forEach((unit) => {
            if (unit.faction === this.playerFaction) this.playerDeaths++;
            else this.aiDeaths++;
            this.createDeathEffect(unit.x, unit.y, unit.faction);
            unit.destroy();
          });
        }

        createAttackLine(fromX: number, fromY: number, toX: number, toY: number, faction: "legacy" | "modern") {
          const color = faction === "legacy" ? 0xff4500 : 0x00bfff;
          const line = this.add.graphics();
          line.lineStyle(3, color, 0.8);
          line.lineBetween(fromX, fromY, toX, toY);
          
          this.tweens.add({
            targets: line,
            alpha: 0,
            duration: 150,
            onComplete: () => line.destroy(),
          });
        }

        createHitEffect(x: number, y: number, damage: number, isBoss: boolean) {
          // 데미지 숫자 표시
          const dmgText = this.add.text(x, y - 20, `-${damage}`, {
            fontSize: isBoss ? "24px" : "18px",
            color: "#ff4444",
            fontFamily: "Courier New",
            stroke: "#000",
            strokeThickness: 4,
          }).setOrigin(0.5);
          
          this.tweens.add({
            targets: dmgText,
            y: y - 60,
            alpha: 0,
            scale: 1.5,
            duration: 800,
            onComplete: () => dmgText.destroy(),
          });
          
          // 타격 플래시 효과
          const flash = this.add.circle(x, y, isBoss ? 40 : 25, 0xff0000, 0.6);
          this.tweens.add({
            targets: flash,
            scale: 1.5,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy(),
          });
          
          // 파티클 이펙트
          for (let i = 0; i < (isBoss ? 8 : 4); i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 20;
            const particle = this.add.circle(x, y, 3, 0xffaa00, 1);
            this.tweens.add({
              targets: particle,
              x: x + Math.cos(angle) * dist,
              y: y + Math.sin(angle) * dist,
              alpha: 0,
              scale: 0,
              duration: 300,
              onComplete: () => particle.destroy(),
            });
          }
          
          // 화면 흔들림 (보스 공격시)
          if (isBoss) {
            this.cameras.main.shake(100, 0.01);
          }
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
              target.hp = Math.min(target.hp + 10, target.maxHp);
             
              // 힐 이펙트
              const heal = this.add.text(target.x, target.y - 20, "+10", {
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

        // 추가/변경: checkBaseReach() 판정 로직 강화 (승패 판정 부분 교체)
        checkBaseReach() {
          if (this.gameOver) return;

          const units = this.getUnits();

          for (const unit of units) {
            // Legacy 유닛이 오른쪽 끝 도달 = Modern 기지 공격
            if (unit.faction === "legacy" && unit.x >= FIELD_END_X) {
              this.modernBaseHP--;
              this.createBaseHitEffect(GAME_WIDTH - 80, 350, "modern");
              unit.destroy();
            } 
            // Modern 유닛이 왼쪽 끝 도달 = Legacy 기지 공격
            else if (unit.faction === "modern" && unit.x <= FIELD_START_X) {
              this.legacyBaseHP--;
              this.createBaseHitEffect(80, 350, "legacy");
              unit.destroy();
            }
          }

          // 추가/변경: 승리 faction 명확화 및 로그
          if (this.modernBaseHP <= 0) {
            const winnerFaction = 'legacy'; // modern HP 0 = legacy 승리
            const isPlayerWin = this.playerFaction === winnerFaction;
            console.log('판정: modern HP 0, 승리자:', winnerFaction, '플레이어 승리:', isPlayerWin); // 추가: 디버그 로그
            this.endGame(isPlayerWin ? "🎉 승리! 🎉" : "💀 패배 💀", isPlayerWin);
          } else if (this.legacyBaseHP <= 0) {
            const winnerFaction = 'modern'; // legacy HP 0 = modern 승리
            const isPlayerWin = this.playerFaction === winnerFaction;
            console.log('판정: legacy HP 0, 승리자:', winnerFaction, '플레이어 승리:', isPlayerWin); // 추가: 디버그 로그
            this.endGame(isPlayerWin ? "🎉 승리! 🎉" : "💀 패배 💀", isPlayerWin);
          }
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

          // Legacy HP 바 (왼쪽)
          const legacyRatio = Math.max(0, this.legacyBaseHP / BASE_HP);
          this.legacyHPBar.setScale(legacyRatio, 1);
          this.legacyHPBar.x = 80 - (100 * (1 - legacyRatio) / 2);
          this.legacyHPText.setText(`HP: ${Math.max(0, this.legacyBaseHP)}`);
         
          // Modern HP 바 (오른쪽)
          const modernRatio = Math.max(0, this.modernBaseHP / BASE_HP);
          this.modernHPBar.setScale(modernRatio, 1);
          this.modernHPBar.x = (GAME_WIDTH - 80) + (100 * (1 - modernRatio) / 2);
          this.modernHPText.setText(`HP: ${Math.max(0, this.modernBaseHP)}`);

          this.playerDeathText.setText(`💀 ${this.playerDeaths}/${BOSS_UNLOCK_DEATHS}`);
          // 유닛 수 표시 (기존 사망 카운트 옆에)
          const playerUnits = this.getUnits().filter(u => u.faction === this.playerFaction).length;
          const enemyUnits = this.getUnits().filter(u => u.faction !== this.playerFaction).length;

          if (!this.unitCountText) {
            const countX = this.playerFaction === "legacy" ? 40 : GAME_WIDTH - 200;
            this.unitCountText = this.add.text(countX, 125, "", {
              fontSize: "14px",
              color: "#88ff88",
            });
          }
          this.unitCountText.setText(`⚔️ ${playerUnits}/${this.maxUnitsPerFaction}`);
         
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
         
          const skillIndex = SKILLS.indexOf(this.playerSkill);
         
          if (this.isMultiplayer) {
            // 스킬 사용 시 faction 명시적 전달
            gameWebSocket.useSkill(skillIndex, this.playerFaction); // faction 추가 확인
           
            if (this.isHost) {
              // 호스트: 직접 실행 (자기 faction 적용)
              this.playerSkill.effect(this, this.playerFaction);
            }
            // 게스트: 호스트의 SYNC_STATE로 결과 받음 (자기 적용 방지)
          } else {
            this.playerSkill.effect(this, this.playerFaction);
          }
         
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

        // 추가/변경: endGame 메서드 수정 (호스트 GAME_OVER 브로드캐스트 추가, 저장 로직 강화)
        endGame(message: string, isPlayerWin: boolean) {
          this.gameOver = true;

          // 배경음악 중지
          if (this.bgm) {
            (this.bgm as any).stop();
          }

          console.log("=== 게임 종료 ===");
          console.log("승리:", isPlayerWin);
          console.log("내 진영:", this.playerFaction);
          console.log("멀티플레이어:", this.isMultiplayer);

          // 기존: 호스트 동기화 로직
          if (this.isMultiplayer && this.isHost) {
            console.log('호스트: 최종 동기화 및 종료 브로드캐스트');
           
            // 추가/변경: winner 계산 명확화
            const winnerFaction = this.modernBaseHP <= 0 ? 'legacy' : 'modern';
           
            // 기존: units 배열 구성
            const units: any[] = [];
            this.unitMap.forEach((unit, unitId) => {
              if (unit.active) {
                units.push({
                  unitId,
                  unitType: unit.unitType,
                  faction: unit.faction,
                  x: unit.x,
                  y: unit.y,
                  hp: unit.hp,
                  maxHp: unit.maxHp
                });
              }
            });
           
            // 기존: finalState 구성
            const finalState = {
              legacyBaseHP: this.legacyBaseHP,
              modernBaseHP: this.modernBaseHP,
              legacyElectricity: this.playerFaction === 'legacy' ? this.playerElectricity : this.aiElectricity,
              modernElectricity: this.playerFaction === 'modern' ? this.playerElectricity : this.aiElectricity,
              units,
              legacyDeaths: this.playerFaction === 'legacy' ? this.playerDeaths : this.aiDeaths,
              modernDeaths: this.playerFaction === 'modern' ? this.playerDeaths : this.aiDeaths,
              gameOver: true,
              winner: winnerFaction
            };
            gameWebSocket.syncGameState(finalState);
           
            // 기존: GAME_OVER 전송
            if (this.roomCode) {
              const roomCodeNum = Number(this.roomCode);
              if (!isNaN(roomCodeNum)) {
                gameWebSocket.endGame(roomCodeNum, winnerFaction);
              }
            }
          }

          // 추가/변경: 판정 로그 및 저장 호출 (모든 경우 호출, 분기 제거)
          // 게임 결과를 백엔드에 저장
          const gameDuration = Math.floor((Date.now() - this.gameStartTime) / 1000);
          const isVsAI = !this.isMultiplayer;
          console.log("게임 시간:", gameDuration);
          console.log("AI 대전:", isVsAI);
          console.log('endGame 호출: faction=', this.playerFaction, ', isPlayerWin=', isPlayerWin, ', isHost=', this.isHost, ', isMulti=', this.isMultiplayer); // 추가: 상세 디버그 로그
         
          GameApi.saveResult(this.playerFaction, isPlayerWin, isVsAI, gameDuration)
            .then(response => {
              if (response && response.success) {
                console.log("저장 응답:", response);
                // 로컬 사용자 정보 업데이트 (기존 시작)
                const user = TokenManager.getUser();
                if (user) {
                  user.totalGames = (user.totalGames || 0) + 1;
                  if (isPlayerWin) {
                    user.totalWins = (user.totalWins || 0) + 1;
                    if (this.playerFaction === "legacy") {
                      user.legacyWins = (user.legacyWins || 0) + 1;
                    } else {
                      user.modernWins = (user.modernWins || 0) + 1;
                    }
                  } else {
                    user.totalLosses = (user.totalLosses || 0) + 1;
                    if (this.playerFaction === "legacy") {
                      user.legacyLosses = (user.legacyLosses || 0) + 1;
                    } else {
                      user.modernLosses = (user.modernLosses || 0) + 1;
                    }
                  }
                  TokenManager.setUser(user);
                  console.log("유저 업데이트 완료:", user);
                } else {
                  console.log('사용자 정보 없음, 업데이트 생략');
                }
              } else {
                console.error("결과 저장 실패:", response ? response.message : "No response");
              }
            })


            
            .catch(err => {
              console.error("API 호출 오류:", err);
            });

          // 기존: UI 오버레이 생성
            const overlay = this.add.rectangle(
              GAME_WIDTH / 2, GAME_HEIGHT / 2,
              GAME_WIDTH, GAME_HEIGHT,
              0x000000, 0.85
            );
            overlay.setDepth(200);

          const color = isPlayerWin ? "#00ff00" : "#ff4444";
         
          const resultText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, message, {
            fontSize: "56px",
            color: color,
            stroke: "#000",
            strokeThickness: 6,
            fontFamily: "Courier New",
          }).setOrigin(0.5).setDepth(201);

          const detailText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 
            `${this.playerFaction.toUpperCase()} vs ${this.aiFaction.toUpperCase()}`, {
            fontSize: "24px",
            color: "#aaa",
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

          // 다시 시작 버튼
          const restartBtn = this.add.container(GAME_WIDTH / 2 - 110, GAME_HEIGHT / 2 + 60);
          restartBtn.setDepth(201);

          const restartBg = this.add.rectangle(0, 0, 200, 50, 0x333333);
          restartBg.setStrokeStyle(2, 0x666666);
          restartBtn.add(restartBg);

          const restartText = this.add.text(0, 0, "🔄 다시 시작", {
            fontSize: "18px",
            color: "#fff",
          }).setOrigin(0.5);
          restartBtn.add(restartText);

          restartBg.setInteractive({ useHandCursor: true });
          restartBg.on("pointerover", () => restartBg.setStrokeStyle(3, 0xffffff));
          restartBg.on("pointerout", () => restartBg.setStrokeStyle(2, 0x666666));
          restartBg.on("pointerdown", () => this.scene.restart({ 
            playerFaction: this.playerFaction, 
            aiFaction: this.aiFaction 
          }));

          // 메인으로 버튼
          const mainBtn = this.add.container(GAME_WIDTH / 2 + 110, GAME_HEIGHT / 2 + 60);
          mainBtn.setDepth(201);

          const mainBg = this.add.rectangle(0, 0, 200, 50, 0x224466);
          mainBg.setStrokeStyle(2, 0x4488aa);
          mainBtn.add(mainBg);

          const mainText = this.add.text(0, 0, "🏠 메인으로", {
            fontSize: "18px",
            color: "#fff",
          }).setOrigin(0.5);
          mainBtn.add(mainText);

          mainBg.setInteractive({ useHandCursor: true });
          mainBg.on("pointerover", () => mainBg.setStrokeStyle(3, 0x66aacc));
          mainBg.on("pointerout", () => mainBg.setStrokeStyle(2, 0x4488aa));
          mainBg.on("pointerdown", () => {
            window.location.href = "/";
          });
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
        backgroundColor: "#1a2030",
        callbacks: {
          preBoot: (game) => {
            // 진영 정보를 registry에 저장
            game.registry.set('playerFaction', playerFaction);
            game.registry.set('aiFaction', aiFaction);
          }
        }
      };

      gameInstanceRef.current = new Phaser.Game(config);
     
      // scene에 데이터 전달
      gameInstanceRef.current.scene.start('GameScene', { 
        playerFaction, 
        aiFaction,
        isMultiplayer: mode === 'multi',
        roomCode,
        isHost: isHostParam
      });
     
      // 멀티플레이어 설정
      setupMultiplayer();
    });

    return () => {
      gameWebSocket.disconnect(); // WebSocket 연결 해제
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