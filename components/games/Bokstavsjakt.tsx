"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { todayKey, dayNumberFor, mulberry32 } from "@/lib/dateUtils";
import { DICTIONARY } from "@/lib/data/dictionary";
import { saveLocalRecap } from "@/lib/localResultCache";
import { usePlayer } from "@/context/PlayerContext";

const ROUND_SECONDS = 45;
const LETTER_COUNT = 9;

const LETTER_BAG =
  "eeeeeeeeeeee" +
  "aaaaaaaaaa" +
  "nnnnnnnnn" +
  "rrrrrrrrr" +
  "tttttttt" +
  "ssssssss" +
  "iiiiiii" +
  "llllll" +
  "ddddd" +
  "ooooo" +
  "mmmmm" +
  "gggg" +
  "kkkk" +
  "vvvv" +
  "hhh" +
  "fff" +
  "uuu" +
  "ppp" +
  "ååå" +
  "bbb" +
  "äää" +
  "öö" +
  "cc" +
  "jj" +
  "yy" +
  "x" +
  "z" +
  "w" +
  "q";

function lettersForDay(dateStr: string): string[] {
  const rand = mulberry32(dayNumberFor(dateStr));
  const letters: string[] = [];
  for (let i = 0; i < LETTER_COUNT; i++) {
    letters.push(LETTER_BAG[Math.floor(rand() * LETTER_BAG.length)]);
  }
  return letters;
}

function canFormWord(word: string, letters: string[]): boolean {
  const available = letters.slice();
  for (const ch of word) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

function pointsFor(length: number): number {
  if (length <= 4) return 1;
  if (length === 5) return 2;
  if (length === 6) return 3;
  if (length === 7) return 5;
  return 8;
}

export interface BokstavsjaktRecap {
  letters: string[];
  found: { word: string; points: number }[];
  score: number;
}

export default function Bokstavsjakt({ onFinish }: { onFinish: (score: number) => void }) {
  const { player } = usePlayer();
  const dateStr = todayKey();
  const letters = useMemo(() => lettersForDay(dateStr), [dateStr]);
  const dictionary = useMemo(() => new Set(DICTIONARY.filter((w) => w.length >= 3)), []);

  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [found, setFound] = useState<{ word: string; points: number }[]>([]);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [finished, setFinished] = useState(false);
  const foundRef = useRef(found);
  foundRef.current = found;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timer);
          finish();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function finish() {
    setFinished((prevFinished) => {
      if (prevFinished) return prevFinished;
      const totalScore = foundRef.current.reduce((sum, f) => sum + f.points, 0);
      if (player) {
        saveLocalRecap<BokstavsjaktRecap>("bokstavsjakt", player.id, dateStr, {
          letters,
          found: foundRef.current,
          score: totalScore
        });
      }
      setTimeout(() => onFinish(totalScore), 1500);
      return true;
    });
  }

  function submit() {
    if (finished) return;
    const guess = input.trim().toLowerCase();
    setInput("");
    if (guess.length < 3) {
      setMessage("Minst 3 bokstäver");
      return;
    }
    if (found.some((f) => f.word === guess)) {
      setMessage("Redan hittat");
      return;
    }
    if (!canFormWord(guess, letters)) {
      setMessage("Går inte att bilda av bokstäverna");
      return;
    }
    if (!dictionary.has(guess)) {
      setMessage("Inte ett giltigt ord");
      return;
    }
    const points = pointsFor(guess.length);
    setFound((f) => [...f, { word: guess, points }]);
    setMessage("");
  }

  if (finished) {
    const totalScore = found.reduce((sum, f) => sum + f.points, 0);
    return (
      <div className="bs-wrap">
        <p className="bs-timer">Tiden är ute!</p>
        <p className="bs-total">{totalScore} poäng</p>
        <p className="bs-found-label">Dina ord ({found.length})</p>
        <div className="bs-found-list">
          {found.length ? (
            found.map((f, i) => (
              <span key={i} className="bs-chip">
                {f.word} <b>+{f.points}</b>
              </span>
            ))
          ) : (
            <span className="bs-hint-text">Inga ord hittade denna gång</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bs-wrap">
      <p className="bs-timer">{secondsLeft}s</p>
      <div className="bs-letters">
        {letters.map((ch, i) => (
          <div key={i} className="bs-letter">
            {ch.toUpperCase()}
          </div>
        ))}
      </div>
      <input
        type="text"
        className="bs-input"
        placeholder="Skriv ett ord…"
        autoComplete="off"
        autoFocus
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <p className="bs-message">{message}</p>
      <p className="bs-found-label">Hittade ord ({found.length})</p>
      <div className="bs-found-list">
        {found.map((f, i) => (
          <span key={i} className="bs-chip">
            {f.word} <b>+{f.points}</b>
          </span>
        ))}
      </div>
    </div>
  );
}
