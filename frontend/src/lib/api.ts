// frontend/src/lib/api.ts
const API_BASE_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? `http://${window.location.hostname}:8080`
  : 'http://localhost:8080';

// 토큰 관리
export const TokenManager = {
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('transistor_token');
    }
    return null;
  },
  
  setToken: (token: string) => {
    localStorage.setItem('transistor_token', token);
  },
  
  removeToken: () => {
    localStorage.removeItem('transistor_token');
  },
  
  getUser: () => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('transistor_user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
  
  setUser: (user: UserResponse) => {
    localStorage.setItem('transistor_user', JSON.stringify(user));
  },
  
  removeUser: () => {
    localStorage.removeItem('transistor_user');
  },
  
  clear: () => {
    TokenManager.removeToken();
    TokenManager.removeUser();
  }
};

// API 응답 타입
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// 사용자 타입
export interface UserResponse {
  id: number;
  username: string;
  totalGames: number;
  legacyWins: number;
  legacyLosses: number;
  modernWins: number;
  modernLosses: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  createdAt: string;
}
// 인증 응답 타입
interface AuthResponse {
  token: string;
  user: UserResponse;
}

// 방 타입
export interface RoomResponse {
  id: number;
  roomCode: string;
  hostId: number;
  hostName: string;
  hostFaction: string;
  guestId?: number;
  guestName?: string;
  guestFaction?: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  createdAt: string;
}

// 게임 기록 타입
export interface GameRecordResponse {
  id: number;
  player_faction: string;
  opponent_faction: string;
  opponent_name?: string;
  is_win: boolean;
  is_ai_game: boolean;
  game_duration_seconds?: number;
  played_at: string;
}

// 기본 fetch 래퍼
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = TokenManager.getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token && !endpoint.startsWith('/api/auth/'))  {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      message: '서버 연결에 실패했습니다',
    };
  }
}

// ===== Auth API =====
export const AuthApi = {
  signUp: async (username: string, password: string) => {
    const response = await fetchApi<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.success && response.data) {
      TokenManager.setToken(response.data.token);
      TokenManager.setUser(response.data.user);
    }
    
    return response;
  },
  
  login: async (username: string, password: string) => {
    const response = await fetchApi<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (response.success && response.data) {
      TokenManager.setToken(response.data.token);
      TokenManager.setUser(response.data.user);
    }
    
    return response;
  },
  
  logout: () => {
    TokenManager.clear();
  },
};

// ===== User API =====
export const UserApi = {
  getMe: async () => {
    return fetchApi<UserResponse>('/api/users/me');
  },
  
  getById: async (id: number) => {
    return fetchApi<UserResponse>(`/api/users/${id}`);
  },
};

// ===== Room API =====
export const RoomApi = {
  getList: async () => {
    return fetchApi<RoomResponse[]>('/api/rooms/list');
  },
  
  getActive: async () => {
    return fetchApi<RoomResponse[]>('/api/rooms/active');
  },
  
  create: async (faction: string) => {
    return fetchApi<RoomResponse>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ faction }),
    });
  },
  
  join: async (roomCode: string) => {
    return fetchApi<RoomResponse>('/api/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode }),  // ← 여기 수정!
    });
  },
  
  leave: async (roomId: number) => {
    return fetchApi<void>(`/api/rooms/${roomId}/leave`, {
      method: 'POST',
    });
  },
  
  start: async (roomId: number) => {
    return fetchApi<RoomResponse>(`/api/rooms/${roomId}/start`, {
      method: 'POST',
    });
  },
  
  getByCode: async (roomCode: string) => {
    return fetchApi<RoomResponse>(`/api/rooms/code/${roomCode}`);
  },
};

// ===== Game API =====
export const GameApi = {
  saveResult: async (faction: string, isWin: boolean, isAiGame: boolean = true, durationSeconds?: number) => {
    return fetchApi<GameRecordResponse>('/api/games/result', {
      method: 'POST',
      body: JSON.stringify({
        faction,
        isWin,
        isAiGame,
        gameDurationSeconds: durationSeconds,
      }),
    });
  },
  
  getHistory: async () => {
    return fetchApi<GameRecordResponse[]>('/api/games/history');
  },
  
  getRecent: async (limit: number = 10) => {
    return fetchApi<GameRecordResponse[]>(`/api/games/recent?limit=${limit}`);
  },
};

// ===== Ranking API =====
export const RankingApi = {
  getByWinRate: async (limit: number = 10) => {
    return fetchApi<UserResponse[]>(`/api/ranking/winrate?limit=${limit}`);
  },
  
  getByWins: async (limit: number = 10) => {
    return fetchApi<UserResponse[]>(`/api/ranking/wins?limit=${limit}`);
  },
};
