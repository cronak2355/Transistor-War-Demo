// frontend/src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
  total_games: number;
  legacy_wins: number;
  legacy_losses: number;
  modern_wins: number;
  modern_losses: number;
  total_wins: number;
  total_losses: number;
  win_rate: number;
  created_at: string;
}

// 인증 응답 타입
interface AuthResponse {
  token: string;
  user: UserResponse;
}

// 방 타입
export interface RoomResponse {
  id: number;
  room_code: string;
  host_id: number;
  host_name: string;
  host_faction: string;
  guest_id?: number;
  guest_name?: string;
  guest_faction?: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  created_at: string;
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
  
  if (token) {
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
      body: JSON.stringify({ room_code: roomCode }),
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
        is_win: isWin,
        is_ai_game: isAiGame,
        game_duration_seconds: durationSeconds,
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
