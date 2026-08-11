"use client";

import { useRef, useState } from "react";

const ROUNDS = 5;
type RoundState = "idle" | "waiting" | "ready";

export default function Reaktion({ onFinish }: { onFinish: (score: number) => void }) {
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [state, setState] = useState<RoundState>("idle");
  const [label, setLabel] = useState("Tryck för att börja");
  const [tooSoon, setTooSoon] = useState(false);
  const [done, setDone] = useState(false);
  const [finalAvg, setFinalAvg] = useState<number | null>(null);

  const waitTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);

  function beginRound() {
    setState("waiting");
    setTooSoon(false);
    setLabel("Vänta…");
    const delay = 800 + Math.random() * 1800;
    waitTimeout.current = setTimeout(() => {
      setState("ready");
      startedAt.current = performance.now();
      setLabel("KLICKA!");
    }, delay);
  }

  function finish(allTimes: number[]) {
    const avg = Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length);
    setFinalAvg(avg);
    setDone(true);
    setTimeout(() => onFinish(avg), 900);
  }

  function handleClick() {
    if (state === "idle") {
      beginRound();
    } else if (state === "waiting") {
      if (waitTimeout.current) clearTimeout(waitTimeout.current);
      setTooSoon(true);
      setLabel("För tidigt! Klicka för att försöka igen");
      setState("idle");
    } else if (state === "ready") {
      const reaction = Math.round(performance.now() - startedAt.current);
      const nextTimes = [...times, reaction];
      setTimes(nextTimes);
      const nextRound = round + 1;
      setRound(nextRound);
      if (nextRound >= ROUNDS) {
        finish(nextTimes);
      } else {
        setLabel(`${reaction} ms – klicka för nästa omgång`);
        setState("idle");
      }
    }
  }

  if (done && finalAvg !== null) {
    return (
      <div className="rx-wrap">
        <p className="rx-progress">Klart!</p>
        <div className="rx-box" style={{ background: "#8C2F3B", color: "#F2E9D8" }}>
          <span>Snitt: {finalAvg} ms</span>
        </div>
        <p className="rx-hint">{times.map((t) => `${t} ms`).join(" · ")}</p>
      </div>
    );
  }

  return (
    <div className="rx-wrap">
      <p className="rx-progress">
        Omgång {Math.min(round + 1, ROUNDS)} av {ROUNDS}
      </p>
      <div
        className={`rx-box ${state === "ready" ? "is-ready" : ""} ${tooSoon ? "is-toosoon" : ""}`}
        onClick={handleClick}
      >
        <span>{label}</span>
      </div>
      <p className="rx-hint">
        Klicka i rutan så fort den blir grön. Klickar du för tidigt får du börja om omgången.
      </p>
    </div>
  );
}
