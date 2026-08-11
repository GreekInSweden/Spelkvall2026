"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "./supabase";
import { usePlayer } from "@/context/PlayerContext";
import { useGroup } from "@/context/GroupContext";

export interface TodayResult {
  score: number;
  created_at: string;
}

/**
 * Kollar mot databasen (inte localStorage) om spelaren redan har ett
 * resultat för det här spelet idag. Detta är bara för UI:t (visa "redan
 * spelat"-vyn direkt) — den faktiska spärren sitter i record_score()
 * server-side, så den här kollen kan inte kringgås för att fuska,
 * bara för att slippa se spelet blinka till innan omdirigering.
 */
export function useTodayResult(gameId: string) {
  const { player } = usePlayer();
  const { group } = useGroup();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TodayResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!player || !group) {
        setLoading(false);
        setResult(null);
        return;
      }
      setLoading(true);
      try {
        const client = getSupabaseClient();
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const { data, error } = await client
          .from("scores")
          .select("score, created_at")
          .eq("player_id", player.id)
          .eq("game_id", gameId)
          .eq("group_id", group.id)
          .gte("created_at", start.toISOString())
          .order("created_at", { ascending: false })
          .limit(1);
        if (error) throw error;
        if (!cancelled) setResult(data && data.length ? (data[0] as TodayResult) : null);
      } catch {
        if (!cancelled) setResult(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [gameId, player, group]);

  return { loading, result };
}
