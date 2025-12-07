// frontend/src/app/select/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Faction = "legacy" | "modern" | null;

export default function SelectPage() {
  const router = useRouter();
  const [selectedFaction, setSelectedFaction] = useState<Faction>(null);
  const [isStarting, setIsStarting] = useState(false);

  const handleSelect = (faction: Faction) => {
    setSelectedFaction(faction);
  };

  const handleStart = () => {
    if (!selectedFaction) return;
    setIsStarting(true);
    
    // 선택한 진영을 쿼리 파라미터로 전달
    setTimeout(() => {
      router.push(`/game?faction=${selectedFaction}`);
    }, 500);
  };

  const factionData = {
    legacy: {
      name: "LEGACY",
      subtitle: "전통의 힘",
      description: "강력한 공격력과 높은 체력을 가진 전통적인 회로입니다.",
      color: "orange",
      icon: "⚡",
      bgGradient: "from-orange-600 to-red-700",
      borderColor: "border-orange-500",
      textColor: "text-orange-400",
      shadowColor: "shadow-orange-500/50",
      stats: [
        { label: "근접", cost: 25, hp: 25, dmg: 20 },
        { label: "원거리", cost: 45, hp: 15, dmg: 30 },
        { label: "힐러", cost: 40, hp: 20, heal: 1 },
        { label: "보스", cost: 300, hp: 250, dmg: 60 },
      ],
    },
    modern: {
      name: "MODERN",
      subtitle: "최신 기술",
      description: "빠른 생산과 효율적인 자원 관리를 자랑하는 최신 나노미터 기술입니다.",
      color: "cyan",
      icon: "💠",
      bgGradient: "from-cyan-500 to-blue-700",
      borderColor: "border-cyan-500",
      textColor: "text-cyan-400",
      shadowColor: "shadow-cyan-500/50",
      stats: [
        { label: "근접", cost: 20, hp: 20, dmg: 15 },
        { label: "원거리", cost: 40, hp: 10, dmg: 25 },
        { label: "힐러", cost: 35, hp: 15, heal: 1 },
        { label: "보스", cost: 250, hp: 200, dmg: 50 },
      ],
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center p-8">
      {/* 제목 */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
          진영을 선택하세요
        </h1>
        <p className="text-gray-400">Choose your faction</p>
      </div>

      {/* 진영 선택 카드 */}
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-12">
        {/* Legacy */}
        <div
          onClick={() => handleSelect("legacy")}
          className={`relative cursor-pointer transition-all duration-300 
                      ${selectedFaction === "legacy" ? "scale-105" : "hover:scale-102"}
                      ${selectedFaction === "modern" ? "opacity-50" : ""}`}
        >
          <div
            className={`w-80 p-6 rounded-2xl bg-gray-800/80 border-2 transition-all duration-300
                        ${selectedFaction === "legacy" 
                          ? "border-orange-500 shadow-lg shadow-orange-500/30" 
                          : "border-gray-700 hover:border-orange-500/50"}`}
          >
            {/* 헤더 */}
            <div className="text-center mb-6">
              <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${factionData.legacy.bgGradient} 
                              flex items-center justify-center text-5xl mb-4
                              shadow-lg ${factionData.legacy.shadowColor}`}>
                {factionData.legacy.icon}
              </div>
              <h2 className={`text-3xl font-bold ${factionData.legacy.textColor}`}>
                {factionData.legacy.name}
              </h2>
              <p className="text-gray-400">{factionData.legacy.subtitle}</p>
            </div>

            {/* 설명 */}
            <p className="text-gray-300 text-sm text-center mb-6">
              {factionData.legacy.description}
            </p>

            {/* 유닛 스탯 */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">유닛 정보</p>
              {factionData.legacy.stats.map((stat, idx) => (
                <div key={idx} className="flex justify-between text-sm bg-gray-900/50 rounded px-3 py-2">
                  <span className="text-orange-300">{stat.label}</span>
                  <span className="text-gray-400">
                    💰{stat.cost} ❤️{stat.hp} {stat.dmg ? `⚔️${stat.dmg}` : `💚${stat.heal}/s`}
                  </span>
                </div>
              ))}
            </div>

            {/* 선택 표시 */}
            {selectedFaction === "legacy" && (
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-orange-500 rounded-full 
                              flex items-center justify-center text-xl shadow-lg animate-bounce">
                ✓
              </div>
            )}
          </div>
        </div>

        {/* VS */}
        <div className="hidden md:flex items-center">
          <span className="text-4xl text-gray-600 font-bold">VS</span>
        </div>

        {/* Modern */}
        <div
          onClick={() => handleSelect("modern")}
          className={`relative cursor-pointer transition-all duration-300 
                      ${selectedFaction === "modern" ? "scale-105" : "hover:scale-102"}
                      ${selectedFaction === "legacy" ? "opacity-50" : ""}`}
        >
          <div
            className={`w-80 p-6 rounded-2xl bg-gray-800/80 border-2 transition-all duration-300
                        ${selectedFaction === "modern" 
                          ? "border-cyan-500 shadow-lg shadow-cyan-500/30" 
                          : "border-gray-700 hover:border-cyan-500/50"}`}
          >
            {/* 헤더 */}
            <div className="text-center mb-6">
              <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${factionData.modern.bgGradient} 
                              flex items-center justify-center text-5xl mb-4
                              shadow-lg ${factionData.modern.shadowColor}`}>
                {factionData.modern.icon}
              </div>
              <h2 className={`text-3xl font-bold ${factionData.modern.textColor}`}>
                {factionData.modern.name}
              </h2>
              <p className="text-gray-400">{factionData.modern.subtitle}</p>
            </div>

            {/* 설명 */}
            <p className="text-gray-300 text-sm text-center mb-6">
              {factionData.modern.description}
            </p>

            {/* 유닛 스탯 */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">유닛 정보</p>
              {factionData.modern.stats.map((stat, idx) => (
                <div key={idx} className="flex justify-between text-sm bg-gray-900/50 rounded px-3 py-2">
                  <span className="text-cyan-300">{stat.label}</span>
                  <span className="text-gray-400">
                    💰{stat.cost} ❤️{stat.hp} {stat.dmg ? `⚔️${stat.dmg}` : `💚${stat.heal}/s`}
                  </span>
                </div>
              ))}
            </div>

            {/* 선택 표시 */}
            {selectedFaction === "modern" && (
              <div className="absolute -top-3 -right-3 w-10 h-10 bg-cyan-500 rounded-full 
                              flex items-center justify-center text-xl shadow-lg animate-bounce">
                ✓
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 시작 버튼 */}
      <button
        onClick={handleStart}
        disabled={!selectedFaction || isStarting}
        className={`px-16 py-4 rounded-lg font-bold text-xl transition-all duration-300
                    ${selectedFaction
                      ? selectedFaction === "legacy"
                        ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 hover:scale-105"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 hover:scale-105"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }
                    ${isStarting ? "animate-pulse" : ""}`}
      >
        {isStarting ? "게임 로딩 중..." : selectedFaction ? "⚔️ 전투 시작 ⚔️" : "진영을 선택하세요"}
      </button>

      {/* 뒤로가기 */}
      <button
        onClick={() => router.push("/")}
        className="mt-8 text-gray-500 hover:text-gray-300 transition-colors"
      >
        ← 메인으로 돌아가기
      </button>

      {/* 게임 규칙 간단 안내 */}
      <div className="mt-12 text-center text-gray-600 text-sm max-w-lg">
        <p className="mb-2">💡 <span className="text-gray-400">게임 팁</span></p>
        <p>• 전기를 사용해 유닛을 소환하세요 (1초에 50W 충전)</p>
        <p>• 아군 20명 사망 후 보스를 소환할 수 있습니다</p>
        <p>• 상대 기지를 먼저 파괴하면 승리!</p>
      </div>
    </main>
  );
}