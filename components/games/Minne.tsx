"use client";

import { useEffect, useRef, useState } from "react";

const SYMBOLS = ["🍎", "🐶", "🚗", "⚽", "🎈", "🌸", "🎵", "🔑", "🍕", "🐱", "🌙", "⭐", "🍇", "🎲", "🦋", "🌈"];
const PAIR_COUNT = 8;

interface Card {
  id: number;
  symbol: string;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildDeck(): Card[] {
  const chosen = shuffle(SYMBOLS).slice(0, PAIR_COUNT);
  return shuffle([...chosen, ...chosen]).map((symbol, i) => ({ id: i, symbol, matched: false }));
}

export default function Minne({ onFinish }: { onFinish: (score: number) => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [locked, setLocked] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => {
    setCards(buildDeck());
    startedAt.current = performance.now();
  }, []);

  function handleCardClick(id: number) {
    if (locked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || flipped.includes(id)) return;

    const nextFlipped = [...flipped, id];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [aId, bId] = nextFlipped;
      const a = cards.find((c) => c.id === aId)!;
      const b = cards.find((c) => c.id === bId)!;
      if (a.symbol === b.symbol) {
        const nextCards = cards.map((c) => (c.id === aId || c.id === bId ? { ...c, matched: true } : c));
        setCards(nextCards);
        setFlipped([]);
        const nextMatched = matchedCount + 1;
        setMatchedCount(nextMatched);
        if (nextMatched === PAIR_COUNT) {
          const timeSeconds = Math.min(9999, Math.round((performance.now() - startedAt.current) / 1000));
          const score = nextMoves * 10000 + timeSeconds;
          setTimeout(() => onFinish(score), 600);
        }
      } else {
        setLocked(true);
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 700);
      }
    }
  }

  return (
    <div className="minne-wrap">
      <p className="minne-progress">
        {matchedCount}/{PAIR_COUNT} par · {moves} drag
      </p>
      <div className="minne-grid">
        {cards.map((c) => {
          const isUp = c.matched || flipped.includes(c.id);
          return (
            <button
              key={c.id}
              className={`minne-card ${isUp ? "is-up" : ""} ${c.matched ? "is-matched" : ""}`}
              onClick={() => handleCardClick(c.id)}
            >
              <span className="minne-card-inner">{isUp ? c.symbol : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
