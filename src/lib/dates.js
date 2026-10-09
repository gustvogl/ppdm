export function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
}
export function dateLabel(key) {
  return key
    ? parseDate(key).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "Sem prazo";
}
export function monthDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}
export const statusNames = {
  pending: "A fazer",
  in_progress: "Em andamento",
  done: "Concluída",
};
export const priorityNames = { low: "Baixa", medium: "Média", high: "Alta" };
