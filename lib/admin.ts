import { getSupabaseClient } from "./supabase";

export interface PendingGroup {
  id: string;
  name: string;
  owner_name: string;
}

export interface ActiveGroupRow {
  id: string;
  name: string;
  join_code: string;
  member_count: number | string;
  is_active?: boolean;
  enabled_games: string[] | null;
}

export interface AdminPlayerRow {
  id: string;
  name: string;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

export interface GameSettingRow {
  game_id: string;
  is_enabled: boolean;
}

async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const client = getSupabaseClient();
  const { data, error } = await client.rpc(fn, args);
  if (error) throw error;
  return data as T;
}

export const adminFetchPending = (adminId: string) =>
  call<PendingGroup[]>("admin_pending_groups", { p_admin_id: adminId }).then((d) => d || []);

export const adminApprove = (adminId: string, groupId: string) =>
  call("admin_approve_group", { p_admin_id: adminId, p_group_id: groupId });

export const adminReject = (adminId: string, groupId: string) =>
  call("admin_reject_group", { p_admin_id: adminId, p_group_id: groupId });

export const adminFetchActive = (adminId: string) =>
  call<ActiveGroupRow[]>("admin_active_groups", { p_admin_id: adminId }).then((d) => d || []);

export const adminDeleteGroup = (adminId: string, groupId: string) =>
  call("admin_delete_group", { p_admin_id: adminId, p_group_id: groupId });

export const adminSetGames = (adminId: string, groupId: string, games: string[]) =>
  call("admin_set_group_games", { p_admin_id: adminId, p_group_id: groupId, p_games: games });

export const adminSetGroupActive = (adminId: string, groupId: string, active: boolean) =>
  call("admin_set_group_active", { p_admin_id: adminId, p_group_id: groupId, p_active: active });

export const adminListPlayers = (adminId: string) =>
  call<AdminPlayerRow[]>("admin_list_players", { p_admin_id: adminId }).then((d) => d || []);

export const adminSetBanned = (adminId: string, playerId: string, banned: boolean) =>
  call("admin_set_banned", { p_admin_id: adminId, p_player_id: playerId, p_banned: banned });

export const adminListGameSettings = (adminId: string) =>
  call<GameSettingRow[]>("admin_list_game_settings", { p_admin_id: adminId }).then((d) => d || []);

export const adminSetGameEnabled = (adminId: string, gameId: string, enabled: boolean) =>
  call("admin_set_game_enabled", { p_admin_id: adminId, p_game_id: gameId, p_enabled: enabled });
