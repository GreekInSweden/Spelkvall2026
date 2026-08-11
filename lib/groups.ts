import { getSupabaseClient } from "./supabase";

export interface MyGroupRow {
  id: string;
  name: string;
  status: "approved" | "pending";
  enabled_games: string[] | null;
  is_active?: boolean;
  is_owner?: boolean;
  join_code?: string;
}

export async function fetchMyGroups(playerId: string): Promise<MyGroupRow[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("my_groups", { p_player_id: playerId });
  if (error) throw error;
  return data || [];
}

export async function requestGroup(playerId: string, name: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("request_group", { p_player_id: playerId, p_name: name });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function joinGroupByCode(playerId: string, code: string) {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc("join_group", { p_player_id: playerId, p_code: code });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}
