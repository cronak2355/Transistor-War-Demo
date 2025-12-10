"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { TokenManager, RoomApi, RoomResponse } from "@/lib/api";
import { gameWebSocket, GameMessage } from "@/lib/websocket";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomCode = params.code as string;
  
  const [room, setRoom] = useState<RoomResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);
  
  const user = TokenManager.getUser();
  const roomRef = useRef<RoomResponse | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    
    loadRoom();
    const interval = setInterval(loadRoom, 2000);
    return () => clearInterval(interval);
  }, [roomCode]);

  const loadRoom = async () => {
    try {
      const response = await RoomApi.getByCode(roomCode);
      if (response.success && response.data) {
        setRoom(response.data);
        roomRef.current = response.data;
        if (!connected) {
          connectWebSocket();
        }
      } else {
        setError("방을 찾을 수 없습니다");
      }
    } catch (err) {
      console.error("방 로드 실패:", err);
    }
    setLoading(false);
  };

  const connectWebSocket = async () => {
    try {
      await gameWebSocket.connect(roomCode, handleMessage);
      setConnected(true);
      gameWebSocket.joinRoom(user!.id);
    } catch (err) {
      console.error("WebSocket 연결 실패:", err);
    }
  };

  const handleMessage = (message: GameMessage) => {
    console.log("받은 메시지:", message);
    
    switch (message.type) {
      case 'JOIN_ROOM':
        loadRoom();
        break;
        
      case 'GAME_START':
        // roomRef 사용해서 최신 값 가져오기
        const currentRoom = roomRef.current;
        if (currentRoom) {
          const isHost = user?.id === currentRoom.hostId;
          const myFaction = isHost ? currentRoom.hostFaction : currentRoom.guestFaction;
          router.push(`/game?mode=multi&room=${roomCode}&faction=${myFaction}&host=${isHost}`);
        }
        break;
        
      case 'LEAVE_ROOM':
        loadRoom();
        break;
    }
  };

  const handleStartGame = async () => {
    if (!room) return;
    
    const isHost = user?.id === room.hostId;
    if (!isHost) return;
    
    if (!room.guestId) {
      alert("상대방을 기다리는 중입니다...");
      return;
    }
    
    try {
      await RoomApi.start(room.id);
      gameWebSocket.startGame();
      
      // 호스트는 바로 게임으로 (host=true)
      router.push(`/game?mode=multi&room=${roomCode}&faction=${room.hostFaction}&host=true`);
    } catch (err) {
      console.error("게임 시작 실패:", err);
    }
  };

  const handleLeaveRoom = async () => {
    if (room) {
      await RoomApi.leave(room.id);
    }
    gameWebSocket.disconnect();
    router.push("/");
  };

  useEffect(() => {
    return () => {
      gameWebSocket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">로딩중...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error || "방을 찾을 수 없습니다"}</p>
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-white">
          메인으로 돌아가기
        </button>
      </div>
    );
  }

  const isHost = user?.id === room.hostId;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">대기실</h1>
            <div className={`px-3 py-1 rounded text-sm ${connected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {connected ? '연결됨' : '연결중...'}
            </div>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-2">방 코드</p>
            <p className="text-3xl font-mono font-bold text-orange-400">{room.roomCode}</p>
          </div>

          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${room.hostFaction === 'legacy' ? 'border-orange-500/50 bg-orange-500/10' : 'border-cyan-500/50 bg-cyan-500/10'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{room.hostFaction === 'legacy' ? '⚡' : '💠'}</span>
                  <div>
                    <p className="text-white font-bold">{room.hostName}</p>
                    <p className="text-gray-400 text-sm">호스트 {isHost && "(나)"}</p>
                  </div>
                </div>
                <span className={`text-sm ${room.hostFaction === 'legacy' ? 'text-orange-400' : 'text-cyan-400'}`}>
                  {room.hostFaction.toUpperCase()}
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              room.guestId
                ? (room.guestFaction === 'legacy' ? 'border-orange-500/50 bg-orange-500/10' : 'border-cyan-500/50 bg-cyan-500/10')
                : 'border-gray-600 border-dashed bg-gray-800/50'
            }`}>
              {room.guestId ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{room.guestFaction === 'legacy' ? '⚡' : '💠'}</span>
                    <div>
                      <p className="text-white font-bold">{room.guestName}</p>
                      <p className="text-gray-400 text-sm">게스트 {!isHost && "(나)"}</p>
                    </div>
                  </div>
                  <span className={`text-sm ${room.guestFaction === 'legacy' ? 'text-orange-400' : 'text-cyan-400'}`}>
                    {room.guestFaction?.toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-2">
                  <p>상대방 대기중...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={!room.guestId}
              className={`w-full py-4 rounded-lg font-bold text-xl transition-all ${
                room.guestId
                  ? 'bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 text-black hover:scale-105' 
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {room.guestId ? '⚡ 게임 시작 ⚡' : '상대방 대기중...'}
            </button>
          )}
          
          {!isHost && (
            <div className="text-center text-gray-400 py-4">
              호스트가 게임을 시작할 때까지 대기중...
            </div>
          )}

          <button
            onClick={handleLeaveRoom}
            className="w-full py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition"
          >
            나가기
          </button>
        </div>
      </div>
    </main>
  );
}