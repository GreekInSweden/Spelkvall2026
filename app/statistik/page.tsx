"use client";

import { useEffect, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useGroup } from "@/context/GroupContext";
import { GAME_REGISTRY, ALL_GAME_IDS } from "@/lib/gameRegistry";
import { statsFor, leaderboardFor } from "@/lib/leaderboard";
import { friendlyError } from "@/lib/supabase";

interface Row {
  icon: string;
  name: string;
  scoreLabel: string;
  rank: number;
}

export default function StatistikPage() {
  const { player } = usePlayer();
  const { group } = useGroup();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalRounds, setTotalRounds] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!player || !group) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const raw = await statsFor(group!, player!.id);
        if (!raw.length) {
          if (!cancelled) {
            setTotalRounds(0);
            setRows([]);
          }
          return;
        }
        const visibleGameIds = group!.enabled_games || ALL_GAME_IDS;
        const built: Row[] = [];
        for (const id of visibleGameIds) {
          const gameDef = GAME_REGISTRY[id];
          if (!gameDef) continue;
          const gameRows = raw.filter((r) => r.game_id === id);
          if (!gameRows.length) continue;
          const best = gameDef.higherIsBetter
            ? Math.max(...gameRows.map((r) => Number(r.score)))
            : Math.min(...gameRows.map((r) => Number(r.score)));
          const board = await leaderboardFor(group!, id);
          const rank = board.findIndex((r) => r.name === player!.name) + 1;
          built.push({ icon: gameDef.icon, name: gameDef.name, scoreLabel: gameDef.formatScore(best), rank });
        }
        if (!cancelled) {
          setTotalRounds(raw.length);
          setRows(built);
        }
      } catch (e) {
        if (!cancelled) setError(friendlyError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id, group?.id]);

  return (
    <section className="screen is-active">
      <h1 className="screen-title">Min statistik</h1>
      <div className="stats-host">
        {!player ? (
          <div className="stat-empty">Välj en spelare för att se din statistik.</div>
        ) : !group ? (
          <div className="stat-empty">Välj en grupp för att se din statistik.</div>
        ) : loading ? (
          <div className="stat-empty">Laddar statistik…</div>
        ) : error ? (
          <div className="stat-empty">{error}</div>
        ) : totalRounds === 0 ? (
          <div className="stat-empty">{player.name} har inte spelat något än i den här gruppen. Dags att sätta ett rekord!</div>
        ) : (
          <>
            <div className="stat-row">
              <span className="stat-label">Spelade omgångar</span>
              <span className="stat-value">{totalRounds}</span>
            </div>
            {rows.map((r) => (
              <div className="stat-row" key={r.name}>
                <span className="stat-label">
                  {r.icon} {r.name} – bästa
                </span>
                <span className="stat-value">
                  {r.scoreLabel}
                  {r.rank ? <span className="stat-rank">#{r.rank}</span> : null}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </section>
  );
}
