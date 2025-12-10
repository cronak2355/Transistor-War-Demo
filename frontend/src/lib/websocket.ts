import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:8080/ws`
  : 'http://localhost:8080/ws';

export type GameMessageType = 
  | 'JOIN_ROOM' 
  | 'LEAVE_ROOM' 
  | 'GAME_START' 
  | 'SPAWN_UNIT' 
  | 'SPAWN_REQUEST'  // 게스트가 호스트에게 소환 요청
  | 'UNIT_UPDATE'
  | 'USE_SKILL'
  | 'SKILL_REQUEST'  // 게스트가 호스트에게 스킬 요청
  | 'BASE_DAMAGE'
  | 'GAME_END'
  | 'SYNC_STATE';

export interface UnitState {
  unitId: string;
  unitType: string;
  faction: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  isAlive: boolean;
}

export interface GameState {
  legacyBaseHP: number;
  modernBaseHP: number;
  legacyElectricity: number;
  modernElectricity: number;
  units: UnitState[];
  legacyDeaths: number;
  modernDeaths: number;
  gameOver: boolean;
  winner?: string;
}

export interface GameMessage {
  type: GameMessageType;
  roomCode: string;
  playerId?: number;
  data?: Record<string, any>;
}

class GameWebSocket {
  private client: Client | null = null;
  private roomCode: string | null = null;
  private onMessageCallback: ((message: GameMessage) => void) | null = null;
  private connected: boolean = false;

  connect(roomCode: string, onMessage: (message: GameMessage) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      this.roomCode = roomCode;
      this.onMessageCallback = onMessage;

      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        
        onConnect: () => {
          console.log('WebSocket 연결됨');
          this.connected = true;
          
          this.client?.subscribe(`/topic/room/${roomCode}`, (message: IMessage) => {
            const gameMessage: GameMessage = JSON.parse(message.body);
            console.log('메시지 수신:', gameMessage);
            if (this.onMessageCallback) {
              this.onMessageCallback(gameMessage);
            }
          });
          
          resolve();
        },
        
        onStompError: (frame) => {
          console.error('STOMP 에러:', frame);
          reject(new Error('WebSocket 연결 실패'));
        },
        
        onDisconnect: () => {
          console.log('WebSocket 연결 해제');
          this.connected = false;
        }
      });

      this.client.activate();
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  joinRoom(playerId: number) {
    this.send('JOIN_ROOM', { playerId });
  }

  startGame() {
    this.send('GAME_START', {});
  }

  // 호스트가 유닛 소환 (실제 소환)
  spawnUnit(unitType: string, faction: string, x: number, y: number, unitId: string) {
    this.send('SPAWN_UNIT', { unitType, faction, x, y, unitId });
  }

  // 게스트가 소환 요청 (SPAWN_UNIT 타입으로 전송)
  requestSpawn(unitType: string, faction: string) {
    this.send('SPAWN_UNIT', { unitType, faction, isRequest: true });
  }
  updateUnit(unitId: string, x: number, y: number, hp: number, isAlive: boolean) {
    this.send('UNIT_UPDATE', { unitId, x, y, hp, isAlive });
  }

  useSkill(skillIndex: number, faction: string) {
    this.send('USE_SKILL', { skillIndex, faction });
  }

  // 게스트가 스킬 요청 (USE_SKILL 타입으로 전송)
  requestSkill(skillIndex: number, faction: string) {
    this.send('USE_SKILL', { skillIndex, faction, isRequest: true });
  }

  baseDamage(targetFaction: string, damage: number) {
    this.send('BASE_DAMAGE', { targetFaction, damage });
  }

  endGame(winnerId: number, winnerFaction: string) {
    this.send('GAME_END', { winnerId, winnerFaction });
  }

  // 호스트가 전체 게임 상태 전송
  syncGameState(state: GameState) {
    this.send('SYNC_STATE', { gameState: state });
  }

  private send(type: GameMessageType, data: Record<string, any>) {
    if (!this.client || !this.connected || !this.roomCode) {
      console.error('WebSocket 연결 안됨');
      return;
    }

    const message: GameMessage = {
      type,
      roomCode: this.roomCode,
      data
    };

    const destMap: Record<GameMessageType, string> = {
      'JOIN_ROOM': '/app/game.join',
      'LEAVE_ROOM': '/app/game.leave',
      'GAME_START': '/app/game.start',
      'SPAWN_UNIT': '/app/game.spawn',
      'SPAWN_REQUEST': '/app/game.spawn',    // ← spawn으로 변경
      'UNIT_UPDATE': '/app/game.update',
      'USE_SKILL': '/app/game.skill',
      'SKILL_REQUEST': '/app/game.skill',    // ← skill로 변경
      'BASE_DAMAGE': '/app/game.baseDamage',
      'GAME_END': '/app/game.end',
      'SYNC_STATE': '/app/game.sync'
    };

    this.client.publish({
      destination: destMap[type],
      body: JSON.stringify(message)
    });
  }
}

export const gameWebSocket = new GameWebSocket();