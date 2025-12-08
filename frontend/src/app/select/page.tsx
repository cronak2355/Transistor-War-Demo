// frontend/src/app/select/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { TokenManager } from "@/lib/api";

const UNIT_STATS = {
  legacy: {
    warrior: { cost: 25, hp: 25, damage: 20 },
    ranger: { cost: 45, hp: 15, damage: 30 },
    healer: { cost: 40, hp: 20, healRate: 1 },
    boss: { cost: 300, hp: 250, damage: 60 },
  },
  modern: {
    warrior: { cost: 20, hp: 20, damage: 15 },
    ranger: { cost: 40, hp: 10, damage: 25 },
    healer: { cost: 35, hp: 15, healRate: 1 },
    boss: { cost: 250, hp: 200, damage: 50 },
  },
};

type Faction = "legacy" | "modern" | null;

export default function SelectPage() {
  const router = useRouter();
  const [selectedFaction, setSelectedFaction] = useState<Faction>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 로그인 체크
    const token = TokenManager.getToken();
    if (!token) {
      router.push("/");
      return;
    }
    setIsLoaded(true);
  }, [router]);

  const handleSelect = (faction: Faction) => {
    setSelectedFaction(faction);
  };

  const handleStart = () => {
    if (selectedFaction) {
      router.push(`/game?faction=${selectedFaction}`);
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black p-8">
      {/* 배경 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <button
            onClick={handleBack}
            className="absolute left-0 top-0 text-gray-400 hover:text-white transition"
          >
            ← 뒤로
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">진영 선택</h1>
          <p className="text-gray-400">플레이할 진영을 선택하세요</p>
        </div>

        {/* 진영 카드 */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Legacy */}
          <div
            onClick={() => handleSelect("legacy")}
            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              selectedFaction === "legacy"
                ? "border-orange-500 bg-orange-500/10 scale-105"
                : selectedFaction === "modern"
                ? "border-gray-700 bg-gray-800/50 opacity-50"
                : "border-gray-700 bg-gray-800/50 hover:border-orange-500/50"
            }`}
          >
            {selectedFaction === "legacy" && (
              <div className="absolute top-4 right-4 text-2xl">✓</div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30">
                ⚡
              </div>
              <div>
                <h2 className="text-2xl font-bold text-orange-400">LEGACY</h2>
                <p className="text-gray-400 text-sm">전통의 힘 • 높은 체력</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-white font-bold border-b border-gray-700 pb-2">유닛 스탯</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-bold">⚔️ 근접</p>
                  <p className="text-gray-400">비용: {UNIT_STATS.legacy.warrior.cost}W</p>
                  <p className="text-gray-400">HP: {UNIT_STATS.legacy.warrior.hp}</p>
                  <p className="text-gray-400">공격력: {UNIT_STATS.legacy.warrior.damage}</p>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-bold">🏹 원거리</p>
                  <p className="text-gray-400">비용: {UNIT_STATS.legacy.ranger.cost}W</p>
                  <p className="text-gray-400">HP: {UNIT_STATS.legacy.ranger.hp}</p>
                  <p className="text-gray-400">공격력: {UNIT_STATS.legacy.ranger.damage}</p>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-bold">💚 힐러</p>
                  <p className="text-gray-400">비용: {UNIT_STATS.legacy.healer.cost}W</p>
                  <p className="text-gray-400">HP: {UNIT_STATS.legacy.healer.hp}</p>
                  <p className="text-gray-400">초당 회복: {UNIT_STATS.legacy.healer.healRate}</p>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-orange-400 font-bold">👑 보스</p>
                  <p className="text-gray-400">비용: {UNIT_STATS.legacy.boss.cost}W</p>
                  <p className="text-gray-400">HP: {UNIT_STATS.legacy.boss.hp}</p>
                  <p className="text-gray-400">공격력: {UNIT_STATS.legacy.boss.damage}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Modern */}
          <div
            onClick={() => handleSelect("modern")}
            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
              selectedFaction === "modern"
                ? "border-cyan-500 bg-cyan-500/10 scale-105"
                : selectedFaction === "legacy"
                ? "border-gray-700 bg-gray-800/50 opacity-50"
                : "border-gray-700 bg-gray-800/50 hover:border-cyan-500/50"
            }`}
          >
            {selectedFaction === "modern" && (
              <div className="absolute top-4 right-4 text-2xl">✓</div>
            )}
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl shadow-lg shadow-cyan-500/30">
                💠
              </div>
              <div>
                <h2 className="text-2xl font-bold text-cyan-400">MODERN</h2>
                <p className="text-gray-400 text-sm">최신 기술 • 낮은 비용</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-white font-bold border-b border-gray-700 pb-2">유닛 스탯</h3>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-cyan-400 font-bold">⚔️ 근접</p>
                  <p className="text-gray-400">비용: {UNIT_STATS.modern.warrior.cost}W</p>
                  <p className="text-gray-400">HP: {UNIT_STATS.modern.warrior.hp}</p>
                  <p className="text-gray-400">공격력: {UNIT_STATS.modern.warrior.damage}</p>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-cyan-400 font-bold">🏹 원거리</p>
                  <p className="text-gray-400">비용: {UNIT_STATS.modern.ranger.cost}W</p>
                  <p className="text-gray-400">HP: {UNIT_STATS.modern.ranger.hp}</p>
                  <p className="text-gray-400">공격력: {UNIT_STATS.modern.ranger.damage}</p>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-cyan-400 font-bold">💚 힐러</p>
                  <p className="text-gray-400">비용: {UNIT_STATS.modern.healer.cost}W</p>
                  <p className="text-gray-400">HP: {UNIT_STATS.modern.healer.hp}</p>
                  <p className="text-gray-400">초당 회복: {UNIT_STATS.modern.healer.healRate}</p>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <p className="text-cyan-400 font-bold">👑 보스</p>
                  <p className="text-gray-400">비용: {UNIT_STATS.modern.boss.cost}W</p>
                  <p className="text-gray-400">HP: {UNIT_STATS.modern.boss.hp}</p>
                  <p className="text-gray-400">공격력: {UNIT_STATS.modern.boss.damage}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 시작 버튼 */}
        <div className="text-center">
          <button
            onClick={handleStart}
            disabled={!selectedFaction}
            className={`px-16 py-4 font-bold text-xl rounded-lg transition-all duration-300 ${
              selectedFaction
                ? selectedFaction === "legacy"
                  ? "bg-gradient-to-r from-orange-500 to-red-500 text-black hover:scale-105 shadow-lg shadow-orange-500/30"
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:scale-105 shadow-lg shadow-cyan-500/30"
                : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {selectedFaction ? "⚔️ 전투 시작 ⚔️" : "진영을 선택하세요"}
          </button>
        </div>
      </div>
    </main>
  );
}
