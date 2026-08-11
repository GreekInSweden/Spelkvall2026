"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { Player } from "@/lib/types";

const CURRENT_PLAYER_KEY = "spelkvall_current_player_v2";

interface PlayerContextValue {
  player: Player | null;
  isAdmin: boolean;
  loginOrCreatePlayer: (name: string, pin: string) => Promise<Player>;
  searchPlayers: (query: string) => Promise<Player[]>;
  logout: () => void;
  refreshAdminStatus: () => Promise<void>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CURRENT_PLAYER_KEY);
      if (raw) setPlayer(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const refreshAdminStatus = useCallback(async () => {
    const raw = (() => {
      try {
        return localStorage.getItem(CURRENT_PLAYER_KEY);
      } catch {
        return null;
      }
    })();
    const current: Player | null = raw ? JSON.parse(raw) : null;
    if (!current) {
      setIsAdmin(false);
      return;
    }
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.rpc("am_i_admin", { p_player_id: current.id });
      if (error) throw error;
      setIsAdmin(!!data);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (player) refreshAdminStatus();
  }, [player, refreshAdminStatus]);

  const loginOrCreatePlayer = useCallback(async (name: string, pin: string) => {
    const client = getSupabaseClient();
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Namn krävs");
    if (!pin || pin.length < 4) throw new Error("PIN måste vara minst 4 siffror");

    const { data, error } = await client.rpc("login_or_create_player", {
      p_name: trimmed,
      p_pin: pin
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) throw new Error("Kunde inte logga in");

    const newPlayer: Player = { id: row.id, name: row.name };
    localStorage.setItem(CURRENT_PLAYER_KEY, JSON.stringify(newPlayer));
    setPlayer(newPlayer);
    return newPlayer;
  }, []);

  const searchPlayers = useCallback(async (query: string): Promise<Player[]> => {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("players")
      .select("id,name")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(6);
    if (error) throw error;
    return (data as Player[]) || [];
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CURRENT_PLAYER_KEY);
    setPlayer(null);
    setIsAdmin(false);
  }, []);

  return (
    <PlayerContext.Provider
      value={{ player, isAdmin, loginOrCreatePlayer, searchPlayers, logout, refreshAdminStatus }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer måste användas inom PlayerProvider");
  return ctx;
}
