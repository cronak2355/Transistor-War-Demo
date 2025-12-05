// frontend/src/app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <h1 className="text-8xl font-bold text-orange-600 tracking-tight drop-shadow-2xl">
        TRANSISTOR WAR
      </h1>
      <p className="mt-8 text-3xl text-gray-400 font-mono">
        Legacy Circuits vs Modern Nanometer
      </p>
      <div className="mt-16 flex gap-8">
        <div className="text-cyan-400 text-xl animate-pulse">◀ LEGACY</div>
        <div className="text-orange-400 text-xl animate-pulse">MODERN ▶</div>
      </div>
      <p className="mt-20 text-lg text-green-400 animate-bounce">
        게임 로딩 중... 5일 후 친구랑 붙자!
      </p>
    </main>
  )
}