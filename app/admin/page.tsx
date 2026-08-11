"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { ALL_GAME_IDS, GAME_REGISTRY } from "@/lib/gameRegistry";
import {
  adminFetchPending,
  adminApprove,
  adminReject,
  adminFetchActive,
  adminDeleteGroup,
  adminSetGames,
  adminSetGroupActive,
  adminListPlayers,
  adminSetBanned,
  adminListGameSettings,
  adminSetGameEnabled,
  PendingGroup,
  ActiveGroupRow,
  AdminPlayerRow
} from "@/lib/admin";
import { friendlyError } from "@/lib/supabase";
import { showToast } from "@/lib/toast";

type Tab = "pending" | "users" | "games" | "groups";

export default function AdminPage() {
  const { player, isAdmin } = usePlayer();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("pending");

  if (!player || !isAdmin) {
    return (
      <section className="screen is-active">
        <button className="back-btn" onClick={() => router.push("/grupper")}>
          ← Tillbaka till grupper
        </button>
        <h1 className="screen-title">Adminpanel</h1>
        <div className="stat-empty">Du har inte adminbehörighet.</div>
      </section>
    );
  }

  return (
    <section className="screen is-active">
      <button className="back-btn" onClick={() => router.push("/grupper")}>
        ← Tillbaka till grupper
      </button>
      <h1 className="screen-title">Adminpanel</h1>
      <div className="admin-tabs">
        <button className={`tab-btn ${tab === "pending" ? "is-active" : ""}`} onClick={() => setTab("pending")}>
          ⏳ Ansökningar
        </button>
        <button className={`tab-btn ${tab === "users" ? "is-active" : ""}`} onClick={() => setTab("users")}>
          👤 Användare
        </button>
        <button className={`tab-btn ${tab === "games" ? "is-active" : ""}`} onClick={() => setTab("games")}>
          🎮 Spel
        </button>
        <button className={`tab-btn ${tab === "groups" ? "is-active" : ""}`} onClick={() => setTab("groups")}>
          👥 Grupper
        </button>
      </div>
      {tab === "pending" && <PendingTab adminId={player.id} />}
      {tab === "users" && <UsersTab adminId={player.id} />}
      {tab === "games" && <GamesTab adminId={player.id} />}
      {tab === "groups" && <GroupsTab adminId={player.id} />}
    </section>
  );
}

function PendingTab({ adminId }: { adminId: string }) {
  const [pending, setPending] = useState<PendingGroup[] | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    try {
      setPending(await adminFetchPending(adminId));
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="stat-empty">{error}</div>;
  if (pending === null) return <div className="stat-empty">Laddar…</div>;
  if (!pending.length) return <p className="stat-empty">Inga väntande ansökningar.</p>;

  return (
    <div className="admin-list">
      {pending.map((g) => (
        <div className="admin-pending-item" key={g.id}>
          <div>
            <div className="group-card-name">{g.name}</div>
            <div className="admin-owner">av {g.owner_name}</div>
          </div>
          <div className="admin-pending-actions">
            <button
              className="admin-approve-btn"
              onClick={async () => {
                try {
                  await adminApprove(adminId, g.id);
                  showToast("Grupp godkänd!");
                  reload();
                } catch (e) {
                  showToast(friendlyError(e));
                }
              }}
            >
              ✓
            </button>
            <button
              className="admin-reject-btn"
              onClick={async () => {
                if (!confirm("Neka den här ansökan?")) return;
                try {
                  await adminReject(adminId, g.id);
                  showToast("Ansökan nekad.");
                  reload();
                } catch (e) {
                  showToast(friendlyError(e));
                }
              }}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersTab({ adminId }: { adminId: string }) {
  const [players, setPlayers] = useState<AdminPlayerRow[] | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    try {
      setPlayers(await adminListPlayers(adminId));
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="stat-empty">{error}</div>;
  if (players === null) return <div className="stat-empty">Laddar…</div>;

  return (
    <div className="admin-list">
      {players.map((p) => (
        <div className="admin-user-item" key={p.id}>
          <div>
            <div className="group-card-name">
              {p.name}
              {p.is_admin && <span className="admin-badge">Admin</span>}
              {p.is_banned && <span className="admin-badge admin-badge-banned">Utesluten</span>}
            </div>
            <div className="admin-owner">Skapad {new Date(p.created_at).toLocaleDateString("sv-SE")}</div>
          </div>
          {!p.is_admin && (
            <button
              className={`admin-ban-btn ${p.is_banned ? "is-banned" : ""}`}
              onClick={async () => {
                const willBan = !p.is_banned;
                if (willBan && !confirm("Utesluta den här användaren? De kan inte längre logga in.")) return;
                try {
                  await adminSetBanned(adminId, p.id, willBan);
                  showToast(willBan ? "Användare utesluten." : "Användare återinsatt.");
                  reload();
                } catch (e) {
                  showToast(friendlyError(e));
                }
              }}
            >
              {p.is_banned ? "Återinsätt" : "Uteslut"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function GamesTab({ adminId }: { adminId: string }) {
  const [map, setMap] = useState<Record<string, boolean> | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    try {
      const settings = await adminListGameSettings(adminId);
      const m: Record<string, boolean> = {};
      settings.forEach((s) => {
        m[s.game_id] = s.is_enabled;
      });
      setMap(m);
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="stat-empty">{error}</div>;
  if (map === null) return <div className="stat-empty">Laddar…</div>;

  return (
    <>
      <div className="admin-list">
        {ALL_GAME_IDS.map((id) => {
          const game = GAME_REGISTRY[id];
          const enabled = map[id] !== false;
          return (
            <div className="admin-game-item" key={id}>
              <span>
                {game.icon} {game.name}
              </span>
              <label className="admin-game-toggle">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={async (e) => {
                    try {
                      await adminSetGameEnabled(adminId, id, e.target.checked);
                      showToast("Uppdaterat.");
                      reload();
                    } catch (err) {
                      showToast(friendlyError(err));
                    }
                  }}
                />{" "}
                {enabled ? "Synligt" : "Dolt"}
              </label>
            </div>
          );
        })}
      </div>
      <p className="admin-hint">Avstängda spel döljs för alla, i alla grupper – oavsett vad respektive grupp har valt.</p>
    </>
  );
}

function GroupsTab({ adminId }: { adminId: string }) {
  const [active, setActive] = useState<ActiveGroupRow[] | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    try {
      setActive(await adminFetchActive(adminId));
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <div className="stat-empty">{error}</div>;
  if (active === null) return <div className="stat-empty">Laddar…</div>;

  return (
    <div className="admin-list">
      {active.map((g) => (
        <div className="admin-active-item" key={g.id}>
          <div className="admin-active-top">
            <span className="group-card-name">
              {g.name}
              {g.is_active === false ? " (stängd)" : ""}
            </span>
            <div className="admin-pending-actions">
              <button
                className="admin-toggle-active-btn"
                onClick={async () => {
                  const currentlyActive = g.is_active !== false;
                  try {
                    await adminSetGroupActive(adminId, g.id, !currentlyActive);
                    showToast(currentlyActive ? "Grupp stängd." : "Grupp öppnad.");
                    reload();
                  } catch (e) {
                    showToast(friendlyError(e));
                  }
                }}
              >
                {g.is_active === false ? "Öppna" : "Stäng"}
              </button>
              <button
                className="admin-delete-btn"
                onClick={async () => {
                  if (!confirm("Ta bort den här gruppen helt? Går inte att ångra.")) return;
                  try {
                    await adminDeleteGroup(adminId, g.id);
                    showToast("Grupp borttagen.");
                    reload();
                  } catch (e) {
                    showToast(friendlyError(e));
                  }
                }}
              >
                🗑
              </button>
            </div>
          </div>
          <div className="admin-active-meta">
            Kod: <b>{g.join_code}</b> · {g.member_count} medlem{g.member_count === "1" || g.member_count === 1 ? "" : "mar"}
          </div>
          <div className="admin-games">
            {ALL_GAME_IDS.map((id) => {
              const game = GAME_REGISTRY[id];
              const checked = (g.enabled_games || []).includes(id);
              return (
                <label className="admin-game-toggle" key={id}>
                  <input
                    type="checkbox"
                    data-game-id={id}
                    defaultChecked={checked}
                    onChange={async (e) => {
                      const container = e.target.closest(".admin-games") as HTMLElement;
                      const checkedIds = Array.from(container.querySelectorAll<HTMLInputElement>("input[data-game-id]"))
                        .filter((input) => input.checked)
                        .map((input) => input.dataset.gameId as string);
                      try {
                        await adminSetGames(adminId, g.id, checkedIds);
                        showToast("Spellista uppdaterad.");
                      } catch (err) {
                        showToast(friendlyError(err));
                      }
                    }}
                  />{" "}
                  {game.icon} {game.name}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
