"use client";

import { useRouter } from "next/navigation";
import GameHost from "@/components/GameHost";
import GameLeaderboardSidebar from "@/components/GameLeaderboardSidebar";

export default function GamePage({ params }: { params: { gameId: string } }) {
  const router = useRouter();

  return (
    <section className="screen is-active game-screen" id="screen-game">
      <button className="back-btn" onClick={() => router.push("/")}>
        ← Tillbaka
      </button>
      <div className="game-layout">
        <div className="game-host">
          <GameHost gameId={params.gameId} />
        </div>
        <GameLeaderboardSidebar gameId={params.gameId} />
      </div>
    </section>
  );
}
