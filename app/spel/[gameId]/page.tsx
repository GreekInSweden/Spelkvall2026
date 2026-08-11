"use client";

import { useRouter } from "next/navigation";
import GameHost from "@/components/GameHost";

export default function GamePage({ params }: { params: { gameId: string } }) {
  const router = useRouter();

  return (
    <section className="screen is-active" id="screen-game">
      <button className="back-btn" onClick={() => router.push("/")}>
        ← Tillbaka
      </button>
      <div className="game-host">
        <GameHost gameId={params.gameId} />
      </div>
    </section>
  );
}
