"use client";

import { useCallback } from "react";
import { getSupabaseClient } from "./supabase";
import { usePlayer } from "@/context/PlayerContext";
import { useGroup } from "@/context/GroupContext";

/**
 * Sparar resultat via record_score-RPC:n (server-side validering av
 * poänggränser + "redan spelat idag", se sql/002_record_score.sql).
 * Motsvarar recordScore() i gamla app.js, fast utan den osäkra
 * direkt-inserten.
 */
export function useRecordScore() {
  const { player } = usePlayer();
  const { group } = useGroup();

  return useCallback(
    async (gameId: string, score: number) => {
      if (!player || !group) throw new Error("Välj en grupp först");
      const client = getSupabaseClient();
      const { error } = await client.rpc("record_score", {
        p_player_id: player.id,
        p_game_id: gameId,
        p_score: score,
        p_group_id: group.id
      });
      if (error) throw error;
    },
    [player, group]
  );
}
