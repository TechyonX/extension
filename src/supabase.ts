import { LocalStorage } from "@raycast/api";
import { createClient, SupportedStorage } from "@supabase/supabase-js";

const storage: SupportedStorage = {
  getItem: LocalStorage.getItem as (value: string) => Promise<string | null>,
  setItem: LocalStorage.setItem,
  removeItem: LocalStorage.removeItem,
};

export const supabaseUrl = "https://hpiywkenufslzbcpcijs.supabase.co";
export const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwaXl3a2VudWZzbHpiY3BjaWpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODEwMjMzMjksImV4cCI6MTk5NjU5OTMyOX0.TZqsgeV5HdmGpF2sf6B0meliiJN99I5TNiFO-P3hw1g";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: true, persistSession: true, storage, storageKey: "supabase", flowType: "pkce" },
});
