// frontend/src/app/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
<<<<<<< HEAD
import { AuthApi, RoomApi, TokenManager, UserResponse, RoomResponse } from "@/lib/api";
=======

// 임시 방 데이터 (나중에 백엔드 연동)
const mockRooms = [
  { id: "1", host: "Player123", faction: "legacy", status: "waiting", createdAt: "2분 전" },
  { id: "2", host: "GamerX", faction: "modern", status: "playing", createdAt: "5분 전" },
  { id: "3", host: "ProGamer", faction: "legacy", status: "waiting", createdAt: "10분 전" },
];
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565

export default function Home() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
<<<<<<< HEAD
  const [user, setUser] = useState<UserResponse | null>(null);
  
  // 방 목록
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  // 폼 상태
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    
    // 저장된 로그인 상태 확인
    const savedUser = TokenManager.getUser();
    const token = TokenManager.getToken();
    
    if (savedUser && token) {
      setIsLoggedIn(true);
      setUser(savedUser);
    }
    
    // 방 목록 로드
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
=======
  const [username, setUsername] = useState("");
  
  // 폼 상태
  const [loginForm, setLoginForm] = useState({ id: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ id: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoaded(true);
    // 로컬 스토리지에서 로그인 상태 확인 (임시)
    const savedUser = localStorage.getItem("transistor_user");
    if (savedUser) {
      setIsLoggedIn(true);
      setUsername(JSON.parse(savedUser).id);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!loginForm.id || !loginForm.password) {
      setError("아이디와 비밀번호를 입력하세요");
      return;
    }
    
    // 임시 로그인 (나중에 백엔드 연동)
    const users = JSON.parse(localStorage.getItem("transistor_users") || "[]");
    const user = users.find((u: any) => u.id === loginForm.id && u.password === loginForm.password);
    
    if (user) {
      localStorage.setItem("transistor_user", JSON.stringify(user));
      setIsLoggedIn(true);
      setUsername(user.id);
      setShowLogin(false);
      setLoginForm({ id: "", password: "" });
    } else {
      setError("아이디 또는 비밀번호가 틀렸습니다");
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!registerForm.id || !registerForm.password) {
      setError("모든 필드를 입력하세요");
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
      return;
    }
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
<<<<<<< HEAD
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
=======
      return;
    }
    
    if (registerForm.id.length < 3) {
      setError("아이디는 3자 이상이어야 합니다");
      return;
    }
    
    // 임시 회원가입 (나중에 백엔드 연동)
    const users = JSON.parse(localStorage.getItem("transistor_users") || "[]");
    
    if (users.find((u: any) => u.id === registerForm.id)) {
      setError("이미 존재하는 아이디입니다");
      return;
    }
    
    const newUser = {
      id: registerForm.id,
      password: registerForm.password,
      totalGames: 0,
      legacyWins: 0,
      legacyLosses: 0,
      modernWins: 0,
      modernLosses: 0,
      createdAt: new Date().toISOString(),
    };
    
    users.push(newUser);
    localStorage.setItem("transistor_users", JSON.stringify(users));
    localStorage.setItem("transistor_user", JSON.stringify(newUser));
    setIsLoggedIn(true);
    setUsername(newUser.id);
    setShowRegister(false);
    setRegisterForm({ id: "", password: "", confirmPassword: "" });
  };

  const handleLogout = () => {
    localStorage.removeItem("transistor_user");
    setIsLoggedIn(false);
    setUsername("");
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
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

<<<<<<< HEAD
  const handleJoinRoom = async (roomCode: string) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    
    const response = await RoomApi.join(roomCode);
    if (response.success && response.data) {
      alert(`방 ${roomCode}에 참가했습니다! (멀티플레이어는 추후 구현)`);
      loadRooms();
    } else {
      alert(response.message || "방 참가 실패");
    }
  };

  // 시간 포맷팅
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diff < 1) return "방금 전";
    if (diff < 60) return `${diff}분 전`;
    if (diff < 1440) return `${Math.floor(diff / 60)}시간 전`;
    return `${Math.floor(diff / 1440)}일 전`;
  };

=======
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
  return (
    <main className="flex min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* 왼쪽: 로고 + 게임 시작 */}
      <div className={`flex-1 flex flex-col items-center justify-center relative z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* 로고 */}
        <div className="mb-8">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            <span className="text-orange-500 drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]">TRANSISTOR</span>
          </h1>
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mt-2">
            <span className="text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">WAR</span>
          </h1>
        </div>

        {/* 부제목 */}
        <p className="text-xl text-gray-400 font-mono mb-4">
          Legacy vs Modern • 1 vs 1 전략 게임
        </p>

        {/* 진영 미리보기 */}
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

        {/* 게임 시작 버튼 */}
        <button
          onClick={handleStart}
          className="group relative px-12 py-4 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 
                     text-black font-bold text-xl rounded-lg 
                     hover:scale-105 transition-all duration-300
                     shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50
                     overflow-hidden"
        >
          <span className="relative z-10">⚡ 게임 시작 ⚡</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                          translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
        </button>

        {!isLoggedIn && (
          <p className="mt-4 text-gray-500 text-sm">게임을 시작하려면 로그인이 필요합니다</p>
        )}
      </div>

      {/* 오른쪽: 로그인/방 목록 */}
      <div className={`w-96 bg-gray-900/80 border-l border-gray-700 p-6 flex flex-col relative z-10 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
        
        {/* 로그인 상태 */}
<<<<<<< HEAD
        {isLoggedIn && user ? (
=======
        {isLoggedIn ? (
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
          <div className="mb-6 p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">로그인됨</p>
<<<<<<< HEAD
                <p className="text-white font-bold text-lg">👤 {user.username}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {user.total_games}전 {user.total_wins}승 {user.total_losses}패
                </p>
=======
                <p className="text-white font-bold text-lg">👤 {username}</p>
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
              </div>
              <div className="flex gap-2">
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
<<<<<<< HEAD
                onClick={() => { setShowLogin(true); setShowRegister(false); setError(""); }}
=======
                onClick={() => { setShowLogin(true); setShowRegister(false); }}
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
                className="flex-1 px-4 py-2 bg-orange-500 text-black font-bold rounded hover:bg-orange-400"
              >
                로그인
              </button>
              <button
<<<<<<< HEAD
                onClick={() => { setShowRegister(true); setShowLogin(false); setError(""); }}
=======
                onClick={() => { setShowRegister(true); setShowLogin(false); }}
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                회원가입
              </button>
            </div>
          </div>
        )}

        {/* 진행중인 방 목록 */}
        <div className="flex-1">
<<<<<<< HEAD
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
=======
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            🎮 진행중인 방
            <span className="text-sm text-gray-500 font-normal">({mockRooms.length})</span>
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mockRooms.map((room) => (
              <div
                key={room.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer
                  ${room.status === "waiting" 
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
                    ? "bg-gray-800/50 border-gray-700 hover:border-orange-500/50" 
                    : "bg-gray-800/30 border-gray-700/50 opacity-60"}`}
              >
                <div className="flex items-center justify-between mb-2">
<<<<<<< HEAD
                  <span className="font-bold text-white">{room.host_name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    room.status === "WAITING" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {room.status === "WAITING" ? "대기중" : "게임중"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={room.host_faction === "legacy" ? "text-orange-400" : "text-cyan-400"}>
                    {room.host_faction === "legacy" ? "⚡ Legacy" : "💠 Modern"}
                  </span>
                  <span className="text-gray-500">{formatTime(room.created_at)}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  코드: {room.room_code}
                </div>
                {room.status === "WAITING" && (
                  <button 
                    className="w-full mt-3 py-2 bg-orange-500/20 text-orange-400 rounded text-sm font-bold hover:bg-orange-500/30"
                    onClick={() => handleJoinRoom(room.room_code)}
=======
                  <span className="font-bold text-white">{room.host}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    room.status === "waiting" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {room.status === "waiting" ? "대기중" : "게임중"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={room.faction === "legacy" ? "text-orange-400" : "text-cyan-400"}>
                    {room.faction === "legacy" ? "⚡ Legacy" : "💠 Modern"}
                  </span>
                  <span className="text-gray-500">{room.createdAt}</span>
                </div>
                {room.status === "waiting" && (
                  <button 
                    className="w-full mt-3 py-2 bg-orange-500/20 text-orange-400 rounded text-sm font-bold hover:bg-orange-500/30"
                    onClick={() => {
                      if (!isLoggedIn) {
                        setShowLogin(true);
                      } else {
                        alert("방 참가 기능은 멀티플레이어 구현 후 사용 가능합니다");
                      }
                    }}
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
                  >
                    참가하기
                  </button>
                )}
              </div>
            ))}
          </div>
          
<<<<<<< HEAD
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
=======
          {mockRooms.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p>진행중인 방이 없습니다</p>
              <p className="text-sm mt-1">새 게임을 시작해보세요!</p>
            </div>
          )}
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
        </div>

        {/* 하단 정보 */}
        <div className="mt-4 pt-4 border-t border-gray-700 text-center text-gray-600 text-xs">
          <p>Age of War 기반 • Transistor 테마</p>
        </div>
      </div>

      {/* 로그인 모달 */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
<<<<<<< HEAD
          <div className="bg-gray-800 p-8 rounded-xl w-96 border border-gray-700 relative">
=======
          <div className="bg-gray-800 p-8 rounded-xl w-96 border border-gray-700">
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
            <h2 className="text-2xl font-bold text-white mb-6 text-center">로그인</h2>
            
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-2">아이디</label>
                <input
                  type="text"
<<<<<<< HEAD
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  placeholder="아이디를 입력하세요"
                  disabled={loading}
=======
                  value={loginForm.id}
                  onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-orange-500 focus:outline-none"
                  placeholder="아이디를 입력하세요"
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
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
<<<<<<< HEAD
                  disabled={loading}
=======
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
                />
              </div>
              
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              
              <button
                type="submit"
<<<<<<< HEAD
                className="w-full py-3 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "로그인 중..." : "로그인"}
=======
                className="w-full py-3 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition"
              >
                로그인
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
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
<<<<<<< HEAD
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  placeholder="3자 이상 입력"
                  disabled={loading}
=======
                  value={registerForm.id}
                  onChange={(e) => setRegisterForm({ ...registerForm, id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  placeholder="3자 이상 입력"
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
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
<<<<<<< HEAD
                  disabled={loading}
=======
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
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
<<<<<<< HEAD
                  disabled={loading}
=======
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
                />
              </div>
              
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              
              <button
                type="submit"
<<<<<<< HEAD
                className="w-full py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "가입 중..." : "가입하기"}
=======
                className="w-full py-3 bg-cyan-500 text-black font-bold rounded-lg hover:bg-cyan-400 transition"
              >
                가입하기
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
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
    </main>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 76721b8ab0dd7cdc6d80f1ebaf7d4528b3d3b565
