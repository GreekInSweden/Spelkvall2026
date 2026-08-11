"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToast } from "@/lib/toast";

export default function Toast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return subscribeToast((m) => {
      setMsg(m);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMsg(null), 3200);
    });
  }, []);

  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}
