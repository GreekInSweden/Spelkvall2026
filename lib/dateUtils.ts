// sv-SE ger YYYY-MM-DD, stabilt att använda som "dagens datum" i UI.
export function todayKey(): string {
  return new Date().toLocaleDateString("sv-SE");
}

export function dayNumberFor(dateStr: string): number {
  return Math.floor(Date.parse(dateStr + "T00:00:00") / 86400000);
}

export function dayIndexFor(dateStr: string, listLength: number, offset = 0): number {
  const dayNumber = dayNumberFor(dateStr) + offset;
  return ((dayNumber % listLength) + listLength) % listLength;
}

// mulberry32 – liten, deterministisk seedad PRNG (samma för alla spelare samma dag)
export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
