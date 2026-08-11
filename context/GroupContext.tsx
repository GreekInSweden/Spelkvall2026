"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ActiveGroup } from "@/lib/types";

const ACTIVE_GROUP_KEY = "spelkvall_active_group_v1";

interface GroupContextValue {
  group: ActiveGroup | null;
  setGroup: (group: ActiveGroup) => void;
  clearGroup: () => void;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [group, setGroupState] = useState<ActiveGroup | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACTIVE_GROUP_KEY);
      if (raw) setGroupState(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const setGroup = useCallback((g: ActiveGroup) => {
    localStorage.setItem(ACTIVE_GROUP_KEY, JSON.stringify(g));
    setGroupState(g);
  }, []);

  const clearGroup = useCallback(() => {
    localStorage.removeItem(ACTIVE_GROUP_KEY);
    setGroupState(null);
  }, []);

  return (
    <GroupContext.Provider value={{ group, setGroup, clearGroup }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup(): GroupContextValue {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup måste användas inom GroupProvider");
  return ctx;
}
