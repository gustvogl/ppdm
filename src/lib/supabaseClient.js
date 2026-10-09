import { createClient } from "@supabase/supabase-js";
import { validatePublicConfig } from "./config.js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();
export const configurationError = validatePublicConfig(url, key);

export const supabase = configurationError
  ? null
  : createClient(url, key, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

// Retorno do OAuth e da confirmação por e-mail para a raiz deste app.
export function authReturnUrl(path = "/") {
  return new URL(path, window.location.origin).href;
}
