// Utilidades de fechas en zona horaria LOCAL del usuario.
// Las columnas `date` de Postgres llegan como 'YYYY-MM-DD'. `new Date('YYYY-MM-DD')`
// las interpreta como medianoche UTC, lo que en América muestra el día anterior.

/** 'YYYY-MM-DD' de la fecha local (no UTC). */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Convierte 'YYYY-MM-DD' (o un timestamp ISO) a Date en hora local. */
export function parseLocalDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  return new Date(s);
}
