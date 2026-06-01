/**
 * Converte uma string ISO de data para um Date local, sem shift de timezone.
 *
 * Problema: new Date("2026-05-18T00:00:00.000Z") em UTC-3 (Brasil)
 * resulta em 2026-05-17T21:00 → exibe como dia 17 (d-1).
 *
 * Solução: extrair YYYY-MM-DD e criar Date com horário local (sem UTC).
 */
export function parseDate(iso) {
  if (!iso) return null;
  const part = String(iso).split('T')[0]; // "2026-05-18"
  const [y, m, d] = part.split('-').map(Number);
  return new Date(y, m - 1, d); // meia-noite horário local → sem shift
}

/**
 * Formata uma data ISO como "18 de mai." sem shift de timezone.
 */
export function fmtDate(iso, opts = {}) {
  const d = parseDate(iso);
  if (!d) return '';
  const MONTHS = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
  if (opts.full) {
    const MONTHS_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    return `${d.getDate()} de ${MONTHS_FULL[d.getMonth()]}`;
  }
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}.`;
}

/**
 * Retorna quantos dias faltam para uma data ISO (positivo = futuro, negativo = passado).
 */
export function daysUntil(iso) {
  const d = parseDate(iso);
  if (!d) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / 86400000);
}

/**
 * Compara uma data ISO com um Date local (ex: para filtrar tarefas do dia).
 */
export function isSameDay(iso, date) {
  const d = parseDate(iso);
  if (!d || !date) return false;
  return d.toDateString() === date.toDateString();
}
