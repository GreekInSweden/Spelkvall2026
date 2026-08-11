import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  client = createClient(url, anonKey);
  return client;
}

export function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message === "SUPABASE_NOT_CONFIGURED") {
    return "Supabase är inte konfigurerat än – fyll i miljövariablerna (se README).";
  }
  if (/PIN|namn krävs|Fel namn|Ogiltig|behörig|Gruppnamn|Redan spelat/i.test(message)) {
    return message;
  }
  return "Kunde inte nå servern just nu. Kolla internetanslutningen.";
}
