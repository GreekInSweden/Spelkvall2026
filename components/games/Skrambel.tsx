"use client";

import { useMemo, useRef, useState } from "react";
import { todayKey, dayIndexFor } from "@/lib/dateUtils";
import { WORDS_5 } from "@/lib/data/words5";
import { WORDS_6 } from "@/lib/data/words6";
import { saveLocalRecap } from "@/lib/localResultCache";
import { usePlayer } from "@/context/PlayerContext";

export interface SkrambelRecap {
  answer: string;
  timeSeconds: number;
  penalty: number;
}

function scramble(word: string): string {
  let letters: string[];
  do {
    letters = word.split("");
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
  } while (letters.join("") === word && word.length > 1);
  return letters.join("");
}

export default function Skrambel({ onFinish }: { onFinish: (score: number) => void }) {
  const { player } = usePlayer();
  const pool = useMemo(() => [...WORDS_5, ...WORDS_6], []);
  const dateStr = todayKey();
  // Annan offset än Ordel (+7) så det inte alltid råkar bli samma ord samma dag.
  const answer = useMemo(() => pool[dayIndexFor(dateStr, pool.length, 7)], [pool, dateStr]);
  const scrambled = useMemo(() => scramble(answer), [answer]);

  const [value, setValue] = useState("");
  const [wrongGuesses, setWrongGuesses] = useState(0);
  const [hints, setHints] = useState(0);
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const startedAt = useRef(performance.now());

  function submit() {
    if (finished) return;
    const guess = value.trim().toLowerCase();
    if (guess === answer) {
      finish();
    } else {
      setWrongGuesses((w) => w + 1);
      setMessage("Fel gissning, försök igen");
      setValue("");
    }
  }

  function useHint() {
    if (finished) return;
    if (hints < answer.length - 1) setHints((h) => h + 1);
  }

  function finish() {
    setFinished(true);
    const timeSeconds = Math.min(9999, Math.round((performance.now() - startedAt.current) / 1000));
    const penalty = wrongGuesses + hints * 3;
    const score = penalty * 10000 + timeSeconds;
    if (player) {
      saveLocalRecap<SkrambelRecap>("skrambel", player.id, dateStr, { answer, timeSeconds, penalty });
    }
    setTimeout(() => onFinish(score), 1000);
  }

  if (finished) {
    return (
      <div className="skr-wrap">
        <p className="skr-label">Rätt! Ordet var:</p>
        <p className="skr-answer">{answer.toUpperCase()}</p>
      </div>
    );
  }

  const hintText = hints > 0 ? answer.slice(0, hints).toUpperCase() + "…" : "";

  return (
    <div className="skr-wrap">
      <p className="skr-label">Dagens omkastade ord ({answer.length} bokstäver)</p>
      <div className="skr-letters">
        {scrambled.split("").map((ch, i) => (
          <div key={i} className="skr-letter">
            {ch.toUpperCase()}
          </div>
        ))}
      </div>
      <input
        type="text"
        className="skr-input"
        placeholder="Ditt svar"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <div className="skr-actions">
        <button className="skr-btn skr-btn-primary" onClick={submit}>
          Gissa
        </button>
        <button className="skr-btn" onClick={useHint}>
          Ledtråd (+straff)
        </button>
      </div>
      {hintText && <p className="skr-hint-text">Ledtråd: {hintText}</p>}
      <p className="skr-message">{message}</p>
    </div>
  );
}
