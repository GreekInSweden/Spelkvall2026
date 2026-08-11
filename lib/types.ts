export interface Player {
  id: string;
  name: string;
}

export interface ActiveGroup {
  id: string;
  name: string;
  enabled_games: string[] | null;
  is_active?: boolean;
}

export interface GameDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  higherIsBetter: boolean;
  formatScore: (score: number) => string;
}

export const ALL_GAME_IDS = [
  "reaktion",
  "ordel5",
  "ordel6",
  "minne",
  "uppskatta",
  "skrambel",
  "bokstavsjakt"
] as const;

export type GameId = (typeof ALL_GAME_IDS)[number];
