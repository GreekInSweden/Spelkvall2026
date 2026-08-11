"use client";

import { useMemo, useRef, useState } from "react";
import { todayKey, dayIndexFor } from "@/lib/dateUtils";
import { ESTIMATE_QUESTIONS } from "@/lib/data/estimateQuestions";
import { saveLocalRecap } from "@/lib/localResultCache";
import { usePlayer } from "@/context/PlayerContext";

export interface UppskattaRecap {
  guess: number;
  answer: number;
  question: string;
  unit: string;
  timeSeconds: number;
}

export default function Uppskatta({ onFinish }: { onFinish: (score: number) => void }) {
  const { player } = usePlayer();
  const dateStr = todayKey();
  const question = useMemo(
    () => ESTIMATE_QUESTIONS[dayIndexFor(dateStr, ESTIMATE_QUESTIONS.length)],
    [dateStr]
  );

  const [value, setValue] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ guess: number; score: number } | null>(null);
  const startedAt = useRef(performance.now());

  function submit() {
    const val = parseFloat(value);
    if (isNaN(val)) {
      setMessage("Skriv en siffra först");
      return;
    }
    const percentError = (Math.abs(val - question.a) / Math.max(1, Math.abs(question.a))) * 100;
    const score = Math.round(percentError * 100);
    const timeSeconds = Math.min(9999, Math.round((performance.now() - startedAt.current) / 1000));

    if (player) {
      saveLocalRecap<UppskattaRecap>("uppskatta", player.id, dateStr, {
        guess: val,
        answer: question.a,
        question: question.q,
        unit: question.unit,
        timeSeconds
      });
    }
    setResult({ guess: val, score });
    setTimeout(() => onFinish(score), 1400);
  }

  if (result) {
    return (
      <div className="upp-wrap">
        <p className="upp-question">{question.q}</p>
        <p className="upp-result">
          Du gissade <strong>{result.guess}</strong> {question.unit}
        </p>
        <p className="upp-result">
          Rätt svar: <strong>{question.a}</strong> {question.unit}
        </p>
        <p className="upp-score">{(result.score / 100).toFixed(1)}% fel</p>
      </div>
    );
  }

  return (
    <div className="upp-wrap">
      <p className="upp-question">{question.q}</p>
      <div className="upp-input-row">
        <input
          type="number"
          className="upp-input"
          placeholder="Ditt svar"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <span className="upp-unit">{question.unit}</span>
      </div>
      <button className="upp-submit" onClick={submit}>
        Gissa
      </button>
      <p className="upp-message">{message}</p>
    </div>
  );
}
