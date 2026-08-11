"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { useGroup } from "@/context/GroupContext";
import { fetchMyGroups, requestGroup, joinGroupByCode, MyGroupRow } from "@/lib/groups";
import { friendlyError } from "@/lib/supabase";
import { showToast } from "@/lib/toast";

export default function GrupperPage() {
  const { player, isAdmin } = usePlayer();
  const { group, setGroup } = useGroup();
  const router = useRouter();
  const [groups, setGroups] = useState<MyGroupRow[] | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    if (!player) return;
    try {
      const g = await fetchMyGroups(player.id);
      setGroups(g);
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player?.id]);

  async function handleCreate() {
    const name = prompt("Namn på din nya grupp (t.ex. familjenamn):");
    if (!name || !name.trim() || !player) return;
    try {
      await requestGroup(player.id, name.trim());
      showToast("Skickat! Väntar på godkännande.");
      reload();
    } catch (e) {
      showToast(friendlyError(e));
    }
  }

  async function handleJoin() {
    const code = prompt("Ange gruppkoden du fått:");
    if (!code || !code.trim() || !player) return;
    try {
      const g = await joinGroupByCode(player.id, code.trim());
      setGroup({ id: g.id, name: g.name, enabled_games: g.enabled_games, is_active: g.is_active });
      showToast(`Du är med i ${g.name}!`);
      reload();
    } catch (e) {
      showToast(friendlyError(e));
    }
  }

  if (!player) {
    return (
      <section className="screen is-active">
        <h1 className="screen-title">Grupper</h1>
        <div className="no-group-card">
          <p>Logga in för att se dina grupper.</p>
        </div>
      </section>
    );
  }

  const approved = (groups || []).filter((g) => g.status === "approved");
  const pending = (groups || []).filter((g) => g.status === "pending");

  return (
    <section className="screen is-active">
      <h1 className="screen-title">Grupper</h1>
      <p className="screen-sub">Alla topplistor och all statistik är separata per grupp.</p>

      {isAdmin && (
        <button className="admin-link-btn" style={{ marginBottom: 16 }} onClick={() => router.push("/admin")}>
          🛠️ Adminpanel
        </button>
      )}

      {error && <p className="stat-empty">{error}</p>}
      {groups === null && !error ? (
        <div className="stat-empty">Laddar grupper…</div>
      ) : (
        <>
          {approved.length > 0 && (
            <>
              <p className="groups-label">Mina grupper</p>
              <div className="group-list">
                {approved.map((g) => (
                  <button
                    key={g.id}
                    className={`group-card ${group && group.id === g.id ? "is-active" : ""}`}
                    onClick={() => {
                      setGroup({ id: g.id, name: g.name, enabled_games: g.enabled_games, is_active: g.is_active });
                      showToast(`Aktiv grupp: ${g.name}`);
                    }}
                  >
                    <span className="group-card-name">
                      {g.name}
                      {g.is_active === false ? " (stängd)" : ""}
                    </span>
                    {g.is_owner && <span className="group-card-code">Kod: {g.join_code}</span>}
                    {group && group.id === g.id && <span className="group-card-tag">Aktiv</span>}
                  </button>
                ))}
              </div>
            </>
          )}
          {pending.length > 0 && (
            <>
              <p className="groups-label">Väntar på godkännande</p>
              <div className="group-list">
                {pending.map((g) => (
                  <div key={g.id} className="group-card is-pending">
                    <span className="group-card-name">{g.name}</span>
                    <span className="group-card-tag">⏳ Väntar</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {approved.length === 0 && pending.length === 0 && (
            <p className="stat-empty">Du är inte med i någon grupp än.</p>
          )}
        </>
      )}

      <div className="group-actions">
        <button className="group-action-btn" onClick={handleCreate}>
          + Skapa grupp
        </button>
        <button className="group-action-btn" onClick={handleJoin}>
          Gå med med kod
        </button>
      </div>
    </section>
  );
}
