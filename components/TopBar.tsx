"use client";

import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { useGroup } from "@/context/GroupContext";

export default function TopBar({ onOpenPlayerModal }: { onOpenPlayerModal: () => void }) {
  const { player } = usePlayer();
  const { group } = useGroup();
  const router = useRouter();

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">S</span>
        <span className="brand-name">Spelkväll</span>
      </div>
      <div className="topbar-chips">
        <button className="group-chip" onClick={() => router.push("/grupper")}>
          <span>{group ? group.name : "Ingen grupp"}</span>
        </button>
        <button className="player-chip" onClick={onOpenPlayerModal}>
          <span>{player ? player.name : "Välj spelare"}</span>
        </button>
      </div>
    </header>
  );
}
