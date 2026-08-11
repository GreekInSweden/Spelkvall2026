"use client";

import { useState } from "react";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";
import PlayerModal from "./PlayerModal";
import Toast from "./Toast";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="app">
      <TopBar onOpenPlayerModal={() => setModalOpen(true)} />
      <main className="screens">{children}</main>
      <BottomNav />
      <PlayerModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <Toast />
    </div>
  );
}
