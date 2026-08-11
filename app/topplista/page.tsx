"use client";

import { useEffect, useState } from "react";
import { useGroup } from "@/context/GroupContext";
import { GAME_REGISTRY, ALL_GAME_IDS } from "@/lib/gameRegistry";
import { computeWinsStandings, leaderboardFor, Period, Scope } from "@/lib/leaderboard";
import { friendlyError } from "@/lib/supabase";

export default function TopplistaPage() {
  const { group } = useGroup();
  const [period, setPeriod] = useState<Period>("week");
  const [scope, setScope] = useState<Scope>("today");
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [standings, setStandings] = useState<{ name: string; count: number }[]>([]);
  const [standingsError, setStandingsError] = useState("");
  const [rows, setRows] = useState<{ name: string; score: number }[]>([]);
  const [rowsError, setRowsError] = useState("");
  const [loadingRows, setLoadingRows] = useState(false);

  const visibleGameIds = group ? group.enabled_games || ALL_GAME_IDS : [];

  useEffect(() => {
    if (!activeGame && visibleGameIds.length) setActiveGame(visibleGameIds[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id]);

  useEffect(() => {
    if (!group) return;
    computeWinsStandings(group, period)
      .then(setStandings)
      .catch((e) => setStandingsError(friendlyError(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, period]);

  useEffect(() => {
    if (!group || !activeGame) return;
    setLoadingRows(true);
    leaderboardFor(group, activeGame, scope)
      .then((r) => {
        setRows(r);
        setRowsError("");
      })
      .catch((e) => setRowsError(friendlyError(e)))
      .finally(() => setLoadingRows(false));
  }, [group?.id, activeGame, scope]);

  if (!group) {
    return (
      <section className="screen is-active">
        <h1 className="screen-title">Topplista</h1>
        <div className="empty">Välj en grupp för att se topplistan.</div>
      </section>
    );
  }

  const activeGameDef = activeGame ? GAME_REGISTRY[activeGame] : null;

  return (
    <section className="screen is-active">
      <h1 className="screen-title">Topplista</h1>

      <p className="groups-label" style={{ marginTop: 0 }}>
        🏆 Vinster
      </p>
      <div className="chip-toggle">
        {(["week", "month", "year", "alltime"] as Period[]).map((p) => (
          <button
            key={p}
            className={`scope-btn ${period === p ? "is-active" : ""}`}
            onClick={() => setPeriod(p)}
          >
            {{ week: "Vecka", month: "Månad", year: "År", alltime: "Alla tider" }[p]}
          </button>
        ))}
      </div>
      <ol className="leaderboard">
        {standingsError ? (
          <div className="empty">{standingsError}</div>
        ) : standings.length === 0 ? (
          <div className="empty">Inga vinster registrerade för perioden än.</div>
        ) : (
          standings.map((r, i) => (
            <li key={r.name}>
              <span className="rank">{i + 1}</span>
              <span className="who">{r.name}</span>
              <span className="score">
                <span className="score-primary">{r.count}</span>
                <span className="score-secondary">{r.count === 1 ? "vinst" : "vinster"}</span>
              </span>
            </li>
          ))
        )}
      </ol>

      <p className="groups-label">📅 Dagens resultat per spel</p>
      <div className="game-tabs">
        {visibleGameIds.map((id) => {
          const g = GAME_REGISTRY[id];
          if (!g) return null;
          return (
            <button
              key={id}
              className={`tab-btn ${activeGame === id ? "is-active" : ""}`}
              onClick={() => setActiveGame(id)}
            >
              {g.icon} {g.name}
            </button>
          );
        })}
      </div>
      <div className="chip-toggle">
        {(["today", "alltime"] as Scope[]).map((s) => (
          <button key={s} className={`scope-btn ${scope === s ? "is-active" : ""}`} onClick={() => setScope(s)}>
            {s === "today" ? "Idag" : "Genom tiderna"}
          </button>
        ))}
      </div>
      <div className="leaderboard-header">
        <span>Namn</span>
        <span>Resultat</span>
      </div>
      <ol className="leaderboard">
        {loadingRows ? (
          <div className="empty">Laddar topplista…</div>
        ) : rowsError ? (
          <div className="empty">{rowsError}</div>
        ) : rows.length === 0 ? (
          <div className="empty">
            {scope === "today"
              ? `Ingen har spelat ${activeGameDef?.name ?? ""} idag än. Bli först!`
              : `Ingen har spelat ${activeGameDef?.name ?? ""} än. Bli först!`}
          </div>
        ) : (
          rows.map((r, i) => {
            const label = activeGameDef ? activeGameDef.formatScore(r.score) : String(r.score);
            const parts = label.split(" · ");
            const primary = parts[0];
            const secondary = parts.length > 1 ? parts.slice(1).join(" · ") : "";
            return (
              <li key={r.name}>
                <span className="rank">{i + 1}</span>
                <span className="who">{r.name}</span>
                <span className="score">
                  <span className="score-primary">{primary}</span>
                  {secondary && <span className="score-secondary">{secondary}</span>}
                </span>
              </li>
            );
          })
        )}
      </ol>
    </section>
  );
}
