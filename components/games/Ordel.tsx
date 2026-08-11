"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { todayKey, dayIndexFor } from "@/lib/dateUtils";
import { WORDS_5 } from "@/lib/data/words5";
import { WORDS_6 } from "@/lib/data/words6";
import { VALID_5 } from "@/lib/data/valid5";
import { VALID_6 } from "@/lib/data/valid6";
import { saveLocalRecap } from "@/lib/localResultCache";
import { usePlayer } from "@/context/PlayerContext";

type LetterStatus = "correct" | "present" | "absent";
interface Guess {
  word: string;
  feedback: LetterStatus[];
}

const MAX_GUESSES = 6;
const KEYBOARD_ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "å"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", "ö", "ä"],
  ["ENTER", "z", "x", "c", "v", "b", "n", "m", "BACK"]
];

function evaluateGuess(guess: string, answer: string): LetterStatus[] {
  const result: LetterStatus[] = new Array(guess.length).fill("absent");
  const answerLetters: (string | null)[] = answer.split("");
  const guessLetters = guess.split("");

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      result[i] = "correct";
      answerLetters[i] = null;
    }
  }
  for (let i = 0; i < guessLetters.length; i++) {
    if (result[i] === "correct") continue;
    const idx = answerLetters.indexOf(guessLetters[i]);
    if (idx !== -1) {
      result[i] = "present";
      answerLetters[idx] = null;
    }
  }
  return result;
}

export interface OrdelRecap {
  guesses: Guess[];
  solved: boolean;
  timeSeconds: number;
}

export default function Ordel({
  wordLength,
  onFinish
}: {
  wordLength: 5 | 6;
  onFinish: (score: number) => void;
}) {
  const { player } = usePlayer();
  const words = wordLength === 5 ? WORDS_5 : WORDS_6;
  const validGuesses = wordLength === 5 ? VALID_5 : VALID_6;
  const gameId = wordLength === 5 ? "ordel5" : "ordel6";

  const dateStr = todayKey();
  const answer = useMemo(() => words[dayIndexFor(dateStr, words.length)], [words, dateStr]);
  const wordSet = useMemo(() => new Set([...words, ...validGuesses]), [words, validGuesses]);

  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [finished, setFinished] = useState(false);
  const [message, setMessage] = useState("");
  const keyStatus = useRef<Record<string, LetterStatus>>({});
  const startedAt = useRef(performance.now());
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flashMessage(msg: string) {
    setMessage(msg);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(""), 1600);
  }

  function submitGuess(guessValue: string) {
    if (guessValue.length !== wordLength) {
      flashMessage(`Ordet måste vara ${wordLength} bokstäver`);
      return;
    }
    if (!wordSet.has(guessValue)) {
      flashMessage("Ordet finns inte i listan");
      return;
    }
    const feedback = evaluateGuess(guessValue, answer);
    const nextGuesses = [...guesses, { word: guessValue, feedback }];
    feedback.forEach((status, i) => {
      const letter = guessValue[i];
      const rank = { absent: 0, present: 1, correct: 2 };
      const existing = keyStatus.current[letter];
      if (!existing || rank[status] > rank[existing]) keyStatus.current[letter] = status;
    });

    const solved = guessValue === answer;
    setGuesses(nextGuesses);
    setCurrentGuess("");

    if (solved || nextGuesses.length >= MAX_GUESSES) {
      setFinished(true);
      const timeSeconds = Math.min(9999, Math.round((performance.now() - startedAt.current) / 1000));
      const guessCount = solved ? nextGuesses.length : MAX_GUESSES + 1;
      const score = guessCount * 10000 + timeSeconds;
      if (player) {
        saveLocalRecap<OrdelRecap>(gameId, player.id, dateStr, { guesses: nextGuesses, solved, timeSeconds });
      }
      setTimeout(() => onFinish(score), 1200);
    }
  }

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (finished) return;
      if (e.key === "Enter") {
        submitGuess(currentGuess);
      } else if (e.key === "Backspace") {
        setCurrentGuess((g) => g.slice(0, -1));
      } else {
        const k = e.key.toLowerCase();
        if (/^[a-zåäö]$/.test(k)) {
          setCurrentGuess((g) => (g.length < wordLength ? g + k : g));
        }
      }
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGuess, finished]);

  function cellClass(status?: LetterStatus) {
    if (status === "correct") return "is-correct";
    if (status === "present") return "is-present";
    if (status === "absent") return "is-absent";
    return "";
  }

  function handleKeyClick(key: string) {
    if (finished) return;
    if (key === "ENTER") submitGuess(currentGuess);
    else if (key === "BACK") setCurrentGuess((g) => g.slice(0, -1));
    else setCurrentGuess((g) => (g.length < wordLength ? g + key : g));
  }

  const rows = [];
  for (let r = 0; r < MAX_GUESSES; r++) {
    const g = guesses[r];
    const cells = [];
    for (let c = 0; c < wordLength; c++) {
      let letter = "";
      let cls = "";
      if (g) {
        letter = g.word[c].toUpperCase();
        cls = cellClass(g.feedback[c]);
      } else if (r === guesses.length) {
        letter = (currentGuess[c] || "").toUpperCase();
      }
      cells.push(
        <div key={c} className={`ordel-cell ${cls}`}>
          {letter}
        </div>
      );
    }
    rows.push(
      <div key={r} className="ordel-row">
        {cells}
      </div>
    );
  }

  return (
    <div className="ordel-wrap">
      <p className="ordel-progress">
        Dagens ord · {guesses.length}/{MAX_GUESSES} gissningar
      </p>
      <div className={`ordel-message ${message ? "is-visible" : ""}`}>{message}</div>
      <div className="ordel-board">{rows}</div>
      <div className="ordel-keyboard">
        {KEYBOARD_ROWS.map((row, i) => (
          <div key={i} className="ordel-kb-row">
            {row.map((k) => {
              if (k === "ENTER")
                return (
                  <button key={k} className="ordel-key ordel-key-wide" onClick={() => handleKeyClick("ENTER")}>
                    Skicka
                  </button>
                );
              if (k === "BACK")
                return (
                  <button key={k} className="ordel-key ordel-key-wide" onClick={() => handleKeyClick("BACK")}>
                    ⌫
                  </button>
                );
              const status = keyStatus.current[k];
              return (
                <button key={k} className={`ordel-key ${cellClass(status)}`} onClick={() => handleKeyClick(k)}>
                  {k.toUpperCase()}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
