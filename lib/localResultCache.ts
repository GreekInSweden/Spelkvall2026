// OBS: den här cachen är bara till för att kunna visa en snygg
// "det här svarade du"-vy efter att någon redan spelat dagens omgång.
// Den avgör INTE om man får spela igen — det kollas mot databasen
// (useTodayResult) och stoppas av record_score() server-side. Även om
// någon rensar den här cachen kan de alltså inte spela om och skicka
// in ett nytt resultat.
export function saveLocalRecap<T>(gameId: string, playerId: string, dateStr: string, payload: T) {
  try {
    localStorage.setItem(`spelkvall_recap_${gameId}_${playerId}_${dateStr}`, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export function loadLocalRecap<T>(gameId: string, playerId: string, dateStr: string): T | null {
  try {
    const raw = localStorage.getItem(`spelkvall_recap_${gameId}_${playerId}_${dateStr}`);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
