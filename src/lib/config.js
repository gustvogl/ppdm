export function validatePublicConfig(url, key) {
  if (!url || !key || /SEU_PROJECT_REF|COLE_SUA|sua-chave/i.test(url + key)) {
    return "Preencha a URL e a chave pública do seu projeto.";
  }
  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" &&
      !(
        parsed.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(parsed.hostname)
      )
    ) {
      return "A URL do Supabase deve usar HTTPS.";
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash)
      return "Use apenas a URL pública do projeto.";
  } catch {
    return "A URL do projeto é inválida.";
  }
  if (key.startsWith("sb_secret_"))
    return "Use uma chave publishable ou anon. Uma chave secreta não pode estar no frontend.";
  if (key.startsWith("sb_publishable_")) return null;
  // Compatibilidade com a anon key legada; bloquear service_role no cliente.
  try {
    const payload = key.split(".")[1];
    const claims = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (claims.role !== "anon")
      return "Use a anon key pública, nunca a service_role.";
    return null;
  } catch {
    return "A chave deve ser publishable (sb_publishable_) ou anon (JWT).";
  }
}
