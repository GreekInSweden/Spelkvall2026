"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { useGroup } from "@/context/GroupContext";
import { GAME_REGISTRY, ALL_GAME_IDS } from "@/lib/gameRegistry";
import { getSupabaseClient } from "@/lib/supabase";

export default function HomePage() {
  const { player } = usePlayer();
  const { group } = useGroup();
  const router = useRouter();
  const [bestScores, setBestScores] = useState<Record<string, number | null>>({});

  const visibleGameIds = group ? group.enabled_games || ALL_GAME_IDS : [];

  useEffect(() => {
    if (!player || !group) return;
    let cancelled = false;
    async function loadBests() {
      const client = getSupabaseClient();
      for (const gameId of visibleGameIds) {
        const ascending = !GAME_REGISTRY[gameId]?.higherIsBetter;
        try {
          const { data } = await client
            .from("scores")
            .select("score")
            .eq("player_id", player!.id)
            .eq("game_id", gameId)
            .eq("group_id", group!.id)
            .order("score", { ascending })
            .limit(1);
          if (!cancelled) {
            setBestScores((prev) => ({
              ...prev,
              [gameId]: data && data.length ? Number(data[0].score) : null
            }));
          }
        } catch {
          // ignore per-game failures
        }
      }
    }
    loadBests();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id, group?.id]);

  if (!player) {
    return (
      <section className="screen is-active">
        <h1 className="screen-title">Spelhyllan</h1>
        <div className="no-group-card">
          <p>Logga in för att spela.</p>
        </div>
      </section>
    );
  }

  if (!group) {
    return (
      <section className="screen is-active">
        <h1 className="screen-title">Spelhyllan</h1>
        <div className="no-group-card">
          <p>Du behöver välja eller skapa en grupp innan du kan spela.</p>
          <button className="no-group-btn" onClick={() => router.push("/grupper")}>
            Till grupper
          </button>
        </div>
      </section>
    );
  }

  if (group.is_active === false) {
    return (
      <section className="screen is-active">
        <h1 className="screen-title">Spelhyllan</h1>
        <div className="no-group-card">
          <p>Gruppen &quot;{group.name}&quot; är stängd av en admin just nu.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="screen is-active">
      <h1 className="screen-title">Spelhyllan</h1>
      <p className="screen-sub">Välj ett spel och sätt ett resultat att slå.</p>
      <div className="game-grid">
        {visibleGameIds.map((id) => {
          const game = GAME_REGISTRY[id];
          if (!game) return null;
          const best = bestScores[id];
          return (
            <button key={id} className="game-card" onClick={() => router.push(`/spel/${id}`)}>
              <span className="game-card-icon">{game.icon}</span>
              <span className="game-card-name">{game.name}</span>
              <span className="game-card-desc">{game.description}</span>
              <span className="game-card-best">
                {best === undefined ? "…" : best === null ? "Inte spelat än" : `Ditt bästa: ${game.formatScore(best)}`}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
