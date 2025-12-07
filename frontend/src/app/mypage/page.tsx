// frontend/src/app/mypage/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface UserData {
  id: string;
  totalGames: number;
  legacyWins: number;
  legacyLosses: number;
  modernWins: number;
  modernLosses: number;
  createdAt: string;
}

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("transistor_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      router.push("/");
    }
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">로딩중...</p>
      </div>
    );
  }

  const totalWins = user.legacyWins + user.modernWins;
  const totalLosses = user.legacyLosses + user.modernLosses;
  const winRate = user.totalGames > 0 ? ((totalWins / user.totalGames) * 100).toFixed(1) : "0.0";

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-8">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">마이페이지</h1>
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white transition"
          >
            ← 메인으로
          </button>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{user.id}</h2>
              <p className="text-gray-400 text-sm">
                가입일: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>
          </div>

          {/* 전체 통계 */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-900/50 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{user.totalGames}</p>
              <p className="text-gray-400 text-sm">총 게임</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{totalWins}</p>
              <p className="text-gray-400 text-sm">승리</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">{totalLosses}</p>
              <p className="text-gray-400 text-sm">패배</p>
            </div>
          </div>

          {/* 승률 */}
          <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">승률</span>
              <span className="text-xl font-bold text-yellow-400">{winRate}%</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* 진영별 전적 */}
        <div className="grid grid-cols-2 gap-4">
          {/* Legacy 전적 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-orange-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <h3 className="text-lg font-bold text-orange-400">LEGACY</h3>
                <p className="text-gray-500 text-sm">전통의 힘</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">플레이</span>
                <span className="text-white font-bold">{user.legacyWins + user.legacyLosses}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">승리</span>
                <span className="text-green-400 font-bold">{user.legacyWins}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">패배</span>
                <span className="text-red-400 font-bold">{user.legacyLosses}회</span>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">승률</span>
                  <span className="text-orange-400 font-bold">
                    {(user.legacyWins + user.legacyLosses) > 0
                      ? ((user.legacyWins / (user.legacyWins + user.legacyLosses)) * 100).toFixed(1)
                      : "0.0"}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modern 전적 */}
          <div className="bg-gray-800 rounded-xl p-6 border border-cyan-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl">
                💠
              </div>
              <div>
                <h3 className="text-lg font-bold text-cyan-400">MODERN</h3>
                <p className="text-gray-500 text-sm">최신 기술</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">플레이</span>
                <span className="text-white font-bold">{user.modernWins + user.modernLosses}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">승리</span>
                <span className="text-green-400 font-bold">{user.modernWins}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">패배</span>
                <span className="text-red-400 font-bold">{user.modernLosses}회</span>
              </div>
              <div className="pt-2 border-t border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">승률</span>
                  <span className="text-cyan-400 font-bold">
                    {(user.modernWins + user.modernLosses) > 0
                      ? ((user.modernWins / (user.modernWins + user.modernLosses)) * 100).toFixed(1)
                      : "0.0"}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 게임 시작 버튼 */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/select")}
            className="px-12 py-4 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 
                       text-black font-bold text-xl rounded-lg 
                       hover:scale-105 transition-all duration-300
                       shadow-lg shadow-orange-500/30"
          >
            ⚡ 게임 시작 ⚡
          </button>
        </div>
      </div>
    </main>
  );
}