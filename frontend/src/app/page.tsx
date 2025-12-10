"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { AuthApi, RoomApi, TokenManager, UserResponse, RoomResponse } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  
  // 방 목록
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  // 폼 상태
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 멀티플레이 상태
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [selectedFaction, setSelectedFaction] = useState<"legacy" | "modern">("legacy");
  const [creatingRoom, setCreatingRoom] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    const savedUser = TokenManager.getUser();
    const token = TokenManager.getToken();
    
    if (savedUser && token) {
      setIsLoggedIn(true);
      setUser(savedUser);
    }
    
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const response = await RoomApi.getList();
      if (response.success && response.data) {
        setRooms(response.data);
      }
    } catch (e) {
      console.error('방 목록 로드 실패:', e);
    }
    setLoadingRooms(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    if (!loginForm.username || !loginForm.password) {
      setError("아이디와 비밀번호를 입력하세요");
      setLoading(false);
      return;
    }
    
    const response = await AuthApi.login(loginForm.username, loginForm.password);
    
    if (response.success && response.data) {
      setIsLoggedIn(true);
      setUser(response.data.user);
      setShowLogin(false);
      setLoginForm({ username: "", password: "" });
    } else {
      setError(response.message || "로그인 실패");
    }
    
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    if (!registerForm.username || !registerForm.password) {
      setError("모든 필드를 입력하세요");
      setLoading(false);
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
      setLoading(false);
      return;
    }
    
    if (registerForm.username.length < 3) {
      setError("아이디는 3자 이상이어야 합니다");
      setLoading(false);
      return;
    }
    
    const response = await AuthApi.signUp(registerForm.username, registerForm.password);
    
    if (response.success && response.data) {
      setIsLoggedIn(true);
      setUser(response.data.user);
      setShowRegister(false);
      setRegisterForm({ username: "", password: "", confirmPassword: "" });
    } else {
      setError(response.message || "회원가입 실패");
    }
    
    setLoading(false);
  };

  const handleLogout = () => {
    AuthApi.logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  const handleStart = () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    router.push("/select");
  };

  const handleMyPage = () => {
    router.push("/mypage");
  };

  const handleJoinRoom = async (roomCode: string) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    
    const response = await RoomApi.join(roomCode);
    if (response.success && response.data) {
      router.push(`/room/${response.data.roomCode}`);
    } else {
      alert(response.message || "방 참가 실패");
    }
  };

  // 방 만들기
  const handleCreateRoom = async () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    
    setCreatingRoom(true);
    const response = await RoomApi.create(selectedFaction);
    
    if (response.success && response.data) {
      router.push(`/room/${response.data.roomCode}`);
    } else {
      alert(response.message || "방 생성 실패");
    }
    setCreatingRoom(false);
  };

  // 방 참가 (코드 입력)
  const handleJoinRoomByCode = async () => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    
    if (!joinRoomCode.trim()) {
      alert("방 코드를 입력하세요");
      return;
    }
    
    const response = await RoomApi.join(joinRoomCode.toUpperCase());
    
    if (response.success && response.data) {
      router.push(`/room/${response.data.roomCode}`);
    } else {
      alert(response.message || "방 참가 실패");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return "방금 전";
    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
    return `${Math.floor(diff / 1440)}일 전`;
  };

  return (
    <main className="flex min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* 왼쪽: 로고 + 게임 시작 */}
      <div className={`flex-1 flex flex-col items-center justify-center relative z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            <span className="text-orange-500 drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]">TRANSISTOR</span>
          </h1>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mt-2">
            <span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">WAR</span>
          </h1>
        </div>

        <p className="text-xl text-gray-400 font-mono mb-4">
          Legacy vs Modern • 1 vs 1 전략 게임
        </p>

        <div className="flex justify-center gap-12 my-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30">
              ⚡
            </div>
            <p className="mt-2 text-orange-400 font-bold text-sm">LEGACY</p>
          </div>
          
          <div className="text-gray-600 text-2xl self-center">VS</div>
          
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/30">
              💠
            </div>
            <p className="mt-2 text-cyan-400 font-bold text-sm">MODERN</p>
          </div>
        </div>

        {/* 싱글플레이 버튼 */}
        <button
          onClick={handleStart}
          className="group relative px-12 py-4 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 
                     text-black font-bold text-xl rounded-lg 
                     hover:scale-105 transition-all duration-300
                     shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50
                     overflow-hidden"
        >
          <span className="relative z-10">⚡ 싱글플레이 ⚡</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
        </button>

        {/* 멀티플레이 버튼들 */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => { if (!isLoggedIn) { setShowLogin(true); return; } setShowCreateRoom(true); }}
            className="px-6 py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition"
          >
            🎮 방 만들기
          </button>
          <button
            onClick={() => { if (!isLoggedIn) { setShowLogin(true); return; } setShowJoinRoom(true); }}
            className="px-6 py-3 bg-gray-700 text-white font-bold rounded-lg hover:bg-gray-600 transition"
          >
            🚪 방 참가
          </button>
        </div>

        {!isLoggedIn && (
          <p className="mt-4 text-gray-500 text-sm">게임을 시작하려면 로그인이 필요합니다</p>
        )}
      </div>

      {/* 오른쪽: 로그인/방 목록 */}
      <div className={`w-96 bg-gray-900/80 border-l border-gray-700 p-6 flex flex-col relative z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
        
        {isLoggedIn && user ? (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">로그인됨</p>
                <p className="text-white font-bold text-lg">👤 {user.username}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {user.totalGames}전 {user.totalWins}승 {user.totalLosses}패
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleMyPage}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600"
                >
                  마이페이지
                </button>
                <button 
                  onClick={handleLogout}
                  className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-sm hover:bg-red-600/30"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-sm mb-3">계정이 필요합니다</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowLogin(true); setShowRegister(false); setError(""); }}
                className="flex-1 px-4 py-2 bg-orange-500 text-black font-bold rounded hover:bg-orange-400"
              >
                로그인
              </button>
              <button
                onClick={() => { setShowRegister(true); setShowLogin(false); setError(""); }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                회원가입
              </button>
            </div>
          </div>
        )}

        {/* 대기중인 방 목록 */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              🎮 대기중인 방
              <span className="text-sm text-gray-500 font-normal">({rooms.length})</span>
            </h2>
            <button 
              onClick={loadRooms}
              className="text-gray-500 hover:text-white text-sm"
              disabled={loadingRooms}
            >
              {loadingRooms ? "⏳" : "🔄"}
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer
                  ${room.status === "WAITING" 
                    ? "bg-gray-800/50 border-gray-700 hover:border-orange-500/50" 
                    : "bg-gray-800/30 border-gray-700/50 opacity-60"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">{room.hostName}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    room.status === "WAITING" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {room.status === "WAITING" ? "대기중" : "게임중"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={room.hostFaction === "legacy" ? "text-orange-400" : "text-cyan-400"}>
                    {room.hostFaction === "legacy" ? "⚡ Legacy" : "💠 Modern"}
                  </span>
                  <span className="text-gray-500">{formatTime(room.createdAt)}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  코드: {room.roomCode}
                </div>
                {room.status === "WAITING" && (
                  <button 
                    className="w-full mt-3 py-2 bg-orange-500/20 text-orange-400 rounded text-sm font-bold hover:bg-orange-500/30"
                    onClick={() => handleJoinRoom(room.roomCode)}
                  >
                    참가하기
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {rooms.length === 0 && !loadingRooms && (
            <div className="text-center text-gray-500 py-8">
              <p>대기중인 방이 없습니다</p>
              <p className="text-sm mt-1">새 게임을 시작해보세요!</p>
            </div>
          )}
          
          {loadingRooms && (
            <div className="text-center text-gray-500 py-8">
              <p>로딩중...</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700 text-center text-gray-600 text-xs">
          <p>Age of War 기반 • Transistor 테마</p>
        </div>
      </div>

      {/* 로그인 모달 */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl w-96 border border-gray-700 relative">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">로그인</h2>
            
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">아이디</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  placeholder="아이디를 입력하세요"
                  disabled={loading}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">비밀번호</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  placeholder="비밀번호를 입력하세요"
                  disabled={loading}
                />
              </div>
              
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              
              <button
                type="submit"
                className="w-full py-3 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => { setShowLogin(false); setShowRegister(true); setError(""); }}
                className="text-gray-400 text-sm hover:text-white"
              >
                계정이 없으신가요? <span className="text-orange-400">회원가입</span>
              </button>
            </div>
            
            <button
              onClick={() => { setShowLogin(false); setError(""); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 회원가입 모달 */}
      {showRegister && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl w-96 border border-gray-700 relative">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">회원가입</h2>
            
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">아이디</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  placeholder="3자 이상 입력"
                  disabled={loading}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">비밀번호</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  placeholder="비밀번호를 입력하세요"
                  disabled={loading}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-400 text-sm mb-2">비밀번호 확인</label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  placeholder="비밀번호를 다시 입력하세요"
                  disabled={loading}
                />
              </div>
              
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              
              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "가입 중..." : "가입하기"}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button
                onClick={() => { setShowRegister(false); setShowLogin(true); setError(""); }}
                className="text-gray-400 text-sm hover:text-white"
              >
                이미 계정이 있으신가요? <span className="text-cyan-400">로그인</span>
              </button>
            </div>
            
            <button
              onClick={() => { setShowRegister(false); setError(""); }}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 방 만들기 모달 */}
      {showCreateRoom && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl w-96 border border-gray-700 relative">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">방 만들기</h2>
            
            <p className="text-gray-400 text-sm mb-4 text-center">플레이할 진영을 선택하세요</p>
            
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setSelectedFaction("legacy")}
                className={`flex-1 p-4 rounded-lg border-2 transition ${
                  selectedFaction === "legacy" 
                    ? "border-orange-500 bg-orange-500/20" 
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                <div className="text-3xl text-center mb-2">⚡</div>
                <p className={`text-center font-bold ${selectedFaction === "legacy" ? "text-orange-400" : "text-gray-400"}`}>
                  LEGACY
                </p>
              </button>
              
              <button
                onClick={() => setSelectedFaction("modern")}
                className={`flex-1 p-4 rounded-lg border-2 transition ${
                  selectedFaction === "modern" 
                    ? "border-cyan-500 bg-cyan-500/20" 
                    : "border-gray-600 hover:border-gray-500"
                }`}
              >
                <div className="text-3xl text-center mb-2">💠</div>
                <p className={`text-center font-bold ${selectedFaction === "modern" ? "text-cyan-400" : "text-gray-400"}`}>
                  MODERN
                </p>
              </button>
            </div>
            
            <button
              onClick={handleCreateRoom}
              disabled={creatingRoom}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-cyan-500 text-black font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {creatingRoom ? "생성중..." : "방 만들기"}
            </button>
            
            <button
              onClick={() => setShowCreateRoom(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* 방 참가 모달 */}
      {showJoinRoom && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-xl w-96 border border-gray-700 relative">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">방 참가</h2>
            
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">방 코드</label>
              <input
                type="text"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-700 text-white text-center text-2xl font-mono tracking-widest rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                placeholder="ABC123"
                maxLength={6}
              />
            </div>
            
            <button
              onClick={handleJoinRoomByCode}
              className="w-full py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition"
            >
              참가하기
            </button>
            
            <button
              onClick={() => setShowJoinRoom(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </main>
  );
}