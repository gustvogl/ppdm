export function displayName(user) {
  for (const value of [
    user?.user_metadata?.full_name,
    user?.user_metadata?.name,
    user?.email,
  ])
    if (typeof value === "string" && value.trim())
      return value.trim().slice(0, 120);
  return "Seu espaço";
}
