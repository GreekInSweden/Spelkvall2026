"use client";

import { useEffect, useRef, useState } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useGroup } from "@/context/GroupContext";
import { friendlyError } from "@/lib/supabase";
import type { Player } from "@/lib/types";

export default function PlayerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { player, loginOrCreatePlayer, searchPlayers, logout } = usePlayer();
  const { group, clearGroup } = useGroup();
  const [mode, setMode] = useState<"account" | "login">(player ? "account" : "login");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [noMatches, setNoMatches] = useState(false);
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) setMode(player ? "account" : "login");
  }, [open, player]);

  if (!open) return null;

  function onNameChange(value: string) {
    setName(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setNoMatches(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        const matches = await searchPlayers(value.trim());
        setSuggestions(matches);
        setNoMatches(matches.length === 0);
      } catch {
        setSuggestions([]);
      }
    }, 250);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !pin.trim()) return;
    try {
      const p = await loginOrCreatePlayer(name, pin);
      setName("");
      setPin("");
      setError("");
      onClose();
      window.location.reload();
      void p;
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  function handleLogout() {
    logout();
    clearGroup();
    onClose();
    window.location.href = "/";
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {mode === "account" && player ? (
          <div>
            <h2>Mitt konto</h2>
            <p className="modal-sub">
              Inloggad som <strong>{player.name}</strong>
            </p>
            <p className="account-group-info">{group ? `Aktiv grupp: ${group.name}` : "Ingen grupp vald ännu"}</p>
            <div className="account-actions">
              <button className="group-action-btn" onClick={() => setMode("login")}>
                Byt spelare
              </button>
              <button className="account-logout-btn" onClick={handleLogout}>
                Logga ut
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2>Vem spelar?</h2>
            <p className="modal-sub">Sök fram ditt namn eller skriv ett nytt, ange sedan din PIN-kod.</p>
            <form className="new-player-form" onSubmit={handleSubmit}>
              <div className="name-search-wrap">
                <input
                  type="text"
                  placeholder="Namn…"
                  maxLength={20}
                  autoComplete="off"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                />
                {(suggestions.length > 0 || noMatches) && (
                  <div className="player-suggestions">
                    {suggestions.length > 0
                      ? suggestions.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="suggestion-item"
                            onClick={() => {
                              setName(p.name);
                              setSuggestions([]);
                              setNoMatches(false);
                            }}
                          >
                            {p.name}
                          </button>
                        ))
                      : <p className="suggestion-empty">Inga träffar – skriv PIN för att skapa nytt konto med det namnet</p>}
                  </div>
                )}
              </div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="PIN (4 siffror)"
                maxLength={6}
                autoComplete="off"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
              {error && <p className="suggestion-empty" style={{ color: "#8C2F3B" }}>{error}</p>}
              <button type="submit">Logga in</button>
            </form>
          </div>
        )}
        <button className="modal-close" onClick={onClose}>
          Stäng
        </button>
      </div>
    </div>
  );
}
