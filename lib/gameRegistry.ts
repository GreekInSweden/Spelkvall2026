import type { GameDefinition } from "./types";

const MAX_GUESSES = 6;

function formatOrdel(score: number): string {
  const guesses = Math.floor(score / 10000);
  const seconds = score % 10000;
  if (guesses > MAX_GUESSES) return `Missade · ${seconds}s`;
  return `${guesses} försök · ${seconds}s`;
}

export const GAME_REGISTRY: Record<string, GameDefinition> = {
  reaktion: {
    id: "reaktion",
    name: "Blixtsnabb",
    icon: "⚡",
    description: "Klicka så fort rutan blir grön",
    higherIsBetter: false,
    formatScore: (ms) => `${ms} ms`
  },
  ordel5: {
    id: "ordel5",
    name: "Ordel 5",
    icon: "🟩",
    description: "Gissa dagens ord på 5 bokstäver",
    higherIsBetter: false,
    formatScore: formatOrdel
  },
  ordel6: {
    id: "ordel6",
    name: "Ordel 6",
    icon: "🟨",
    description: "Gissa dagens ord på 6 bokstäver",
    higherIsBetter: false,
    formatScore: formatOrdel
  },
  minne: {
    id: "minne",
    name: "Minnesspel",
    icon: "🧠",
    description: "Hitta alla par på så få drag som möjligt",
    higherIsBetter: false,
    formatScore: (score) => {
      const moves = Math.floor(score / 10000);
      const seconds = score % 10000;
      return `${moves} drag · ${seconds}s`;
    }
  },
  uppskatta: {
    id: "uppskatta",
    name: "Uppskatta",
    icon: "🎯",
    description: "Gissa dagens fråga så nära rätt som möjligt",
    higherIsBetter: false,
    formatScore: (score) => `${(score / 100).toFixed(1)}% fel`
  },
  skrambel: {
    id: "skrambel",
    name: "Skrambel",
    icon: "🔤",
    description: "Lista ut dagens omkastade ord",
    higherIsBetter: false,
    formatScore: (score) => {
      const penalty = Math.floor(score / 10000);
      const seconds = score % 10000;
      return penalty > 0 ? `${seconds}s (+${penalty} straff)` : `${seconds}s`;
    }
  },
  bokstavsjakt: {
    id: "bokstavsjakt",
    name: "Bokstavsjakt",
    icon: "🔠",
    description: "9 bokstäver, 45 sekunder – hitta så många ord som möjligt",
    higherIsBetter: true,
    formatScore: (score) => `${score} poäng`
  }
};

export const ALL_GAME_IDS = Object.keys(GAME_REGISTRY);
