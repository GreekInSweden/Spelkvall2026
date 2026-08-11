"use client";

import { useEffect, useState } from "react";
import { useGroup } from "@/context/GroupContext";
import { GAME_REGISTRY } from "@/lib/gameRegistry";
import { leaderboardFor } from "@/lib/leaderboard";

export default function GameLeaderboardSidebar({ gameId }: { gameId: string }) {
  const { group } = useGroup();
  const game = GAME_REGISTRY[gameId];
  const [rows, setRows] = useState<{ name: string; score: number }[] | null>(null);

  useEffect(() => {
    if (!group) return;
    let cancelled = false;
    leaderboardFor(group, gameId, "today")
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, [group?.id, gameId]);

  if (!game) return null;

  return (
    <aside className="side-panel">
      <p className="side-panel-eyebrow">Idag i {group?.name ?? "gruppen"}</p>
      <h2 className="side-panel-title">
        {game.icon} {game.name}
      </h2>
      <div className="side-panel-divider" />
      {rows === null ? (
        <p className="side-panel-empty">Laddar…</p>
      ) : rows.length === 0 ? (
        <p className="side-panel-empty">Ingen har spelat än idag. Bli först!</p>
      ) : (
        <ol className="side-leaderboard">
          {rows.slice(0, 8).map((r, i) => (
            <li key={r.name}>
              <span className="side-rank">{i + 1}</span>
              <span className="side-who">{r.name}</span>
              <span className="side-score">{game.formatScore(r.score)}</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
