// O limite padrão da API não deve truncar silenciosamente relatórios e backups.
export async function readRows(query) {
  const rows = [];
  const pageSize = 500;
  for (let start = 0; ; start += pageSize) {
    const { data, error } = await query().range(start, start + pageSize - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}
