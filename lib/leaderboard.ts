import { getSupabaseClient } from "./supabase";
import { GAME_REGISTRY } from "./gameRegistry";
import type { ActiveGroup } from "./types";

export type Period = "week" | "month" | "year" | "alltime";
export type Scope = "today" | "alltime";

function higherIsBetterFor(gameId: string): boolean {
  return GAME_REGISTRY[gameId]?.higherIsBetter ?? true;
}

function todayRangeISO() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

function periodStartISO(period: Period): string | null {
  const now = new Date();
  if (period === "week") {
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0).toISOString();
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).toISOString();
  if (period === "year") return new Date(now.getFullYear(), 0, 1, 0, 0, 0).toISOString();
  return null;
}

interface ScoreRow {
  player_id: string;
  game_id: string;
  score: number;
  created_at: string;
  players: { name: string } | { name: string }[] | null;
}

function playerName(row: ScoreRow): string | null {
  if (!row.players) return null;
  return Array.isArray(row.players) ? row.players[0]?.name ?? null : row.players.name;
}

export async function computeWinsStandings(group: ActiveGroup, period: Period) {
  const client = getSupabaseClient();
  let query = client
    .from("scores")
    .select("player_id, game_id, score, created_at, players ( name )")
    .eq("group_id", group.id);
  const startISO = periodStartISO(period);
  if (startISO) query = query.gte("created_at", startISO);
  const { data, error } = await query;
  if (error) throw error;

  const buckets = new Map<string, { name: string; score: number; gameId: string }[]>();
  ((data as unknown as ScoreRow[]) || []).forEach((row) => {
    const name = playerName(row);
    if (!name) return;
    const dateStr = new Date(row.created_at).toLocaleDateString("sv-SE");
    const key = `${row.game_id}|${dateStr}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push({ name, score: Number(row.score), gameId: row.game_id });
  });

  const wins = new Map<string, number>();
  buckets.forEach((rows, key) => {
    const gameId = key.split("|")[0];
    const higherIsBetter = higherIsBetterFor(gameId);
    let best = rows[0];
    rows.forEach((r) => {
      if (higherIsBetter ? r.score > best.score : r.score < best.score) best = r;
    });
    wins.set(best.name, (wins.get(best.name) || 0) + 1);
  });

  return Array.from(wins.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export async function leaderboardFor(group: ActiveGroup, gameId: string, scope: Scope = "alltime") {
  const client = getSupabaseClient();
  const higherIsBetter = higherIsBetterFor(gameId);
  let query = client
    .from("scores")
    .select("score, created_at, players ( name )")
    .eq("game_id", gameId)
    .eq("group_id", group.id);
  if (scope === "today") {
    const { start, end } = todayRangeISO();
    query = query.gte("created_at", start).lt("created_at", end);
  }
  const { data, error } = await query;
  if (error) throw error;

  const bestByPlayer = new Map<string, number>();
  ((data as unknown as ScoreRow[]) || []).forEach((row) => {
    const name = playerName(row);
    if (!name) return;
    const score = Number(row.score);
    const current = bestByPlayer.get(name);
    if (current === undefined || (higherIsBetter ? score > current : score < current)) {
      bestByPlayer.set(name, score);
    }
  });

  return Array.from(bestByPlayer.entries())
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => (higherIsBetter ? b.score - a.score : a.score - b.score));
}

export async function statsFor(group: ActiveGroup, playerId: string) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from("scores")
    .select("game_id, score")
    .eq("player_id", playerId)
    .eq("group_id", group.id);
  if (error) throw error;
  return (data as { game_id: string; score: number }[]) || [];
}
