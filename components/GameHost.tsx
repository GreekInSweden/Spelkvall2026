"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useTodayResult } from "@/lib/useTodayResult";
import { useRecordScore } from "@/lib/useRecordScore";
import { GAME_REGISTRY } from "@/lib/gameRegistry";
import { usePlayer } from "@/context/PlayerContext";
import { todayKey } from "@/lib/dateUtils";
import { loadLocalRecap } from "@/lib/localResultCache";
import { friendlyError } from "@/lib/supabase";

// Varje spel (och dess data, t.ex. hela ordboken för Bokstavsjakt eller
// ordlistorna för Ordel) laddas bara ner när just det spelet öppnas,
// istället för att bundlas ihop för alla spel på /spel/[gameId].
const LOADING = () => <p className="stat-empty">Laddar spelet…</p>;
const Reaktion = dynamic(() => import("./games/Reaktion"), { loading: LOADING, ssr: false });
const Minne = dynamic(() => import("./games/Minne"), { loading: LOADING, ssr: false });
const Ordel = dynamic(() => import("./games/Ordel"), { loading: LOADING, ssr: false });
const Skrambel = dynamic(() => import("./games/Skrambel"), { loading: LOADING, ssr: false });
const Uppskatta = dynamic(() => import("./games/Uppskatta"), { loading: LOADING, ssr: false });
const Bokstavsjakt = dynamic(() => import("./games/Bokstavsjakt"), { loading: LOADING, ssr: false });

export default function GameHost({ gameId }: { gameId: string }) {
  const router = useRouter();
  const { player } = usePlayer();
  const game = GAME_REGISTRY[gameId];
  const { loading, result } = useTodayResult(gameId);
  const recordScore = useRecordScore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!game) {
    return <p className="stat-empty">Okänt spel.</p>;
  }

  async function handleFinish(score: number) {
    setSaving(true);
    setError("");
    try {
      await recordScore(gameId, score);
      setSaving(false);
      // Bara vid lyckad sparning navigerar vi automatiskt tillbaka.
      setTimeout(() => router.push("/"), 600);
    } catch (e) {
      setSaving(false);
      setError(friendlyError(e));
      // Vid fel: stanna kvar så felet syns, ingen auto-redirect.
    }
  }

  if (loading) {
    return <p className="stat-empty">Laddar…</p>;
  }

  if (result) {
    const recap = player ? loadLocalRecap<Record<string, unknown>>(gameId, player.id, todayKey()) : null;
    return (
      <div className="ordel-wrap">
        <p className="ordel-progress">Du har redan spelat {game.name} idag</p>
        <p className="ordel-hint" style={{ fontSize: 16, fontWeight: 800, color: "#16211C" }}>
          Resultat: {game.formatScore(result.score)}
        </p>
        {recap ? (
          <p className="ordel-hint">Nytt att spela imorgon!</p>
        ) : (
          <p className="ordel-hint">Detaljerna sparades bara på den enhet du spelade på. Nytt imorgon!</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="ordel-wrap">
          <p className="ordel-message is-visible" style={{ fontSize: 15 }}>
            Kunde inte spara resultatet: {error}
          </p>
          <button className="no-group-btn" onClick={() => router.push("/")}>
            Tillbaka
          </button>
        </div>
      )}
      {!error && saving && <p className="stat-empty">Sparar…</p>}
      {!error && !saving && (
        <>
          {gameId === "reaktion" && <Reaktion onFinish={handleFinish} />}
          {gameId === "minne" && <Minne onFinish={handleFinish} />}
          {gameId === "ordel5" && <Ordel wordLength={5} onFinish={handleFinish} />}
          {gameId === "ordel6" && <Ordel wordLength={6} onFinish={handleFinish} />}
          {gameId === "skrambel" && <Skrambel onFinish={handleFinish} />}
          {gameId === "uppskatta" && <Uppskatta onFinish={handleFinish} />}
          {gameId === "bokstavsjakt" && <Bokstavsjakt onFinish={handleFinish} />}
        </>
      )}
    </div>
  );
}
