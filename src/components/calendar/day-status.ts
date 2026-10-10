// Come si mostra lo stato di un giorno (US-05): sempre icona più testo, mai il solo colore.
// Condiviso da Calendario (righe della settimana e mese) e dalla striscia della settimana in Oggi.
import CircleCheck from '@lucide/svelte/icons/circle-check';
import CircleDashed from '@lucide/svelte/icons/circle-dashed';
import CirclePlay from '@lucide/svelte/icons/circle-play';
import CircleX from '@lucide/svelte/icons/circle-x';
import Moon from '@lucide/svelte/icons/moon';
import type { DayInfo, DayStatus } from '../../lib/archive';
import { formatLongDay } from '../../lib/format';

export interface StatusLook {
  label: string;
  icon: typeof CircleCheck | null;
  /** classe del colore dell'icona e del testo dello stato */
  tone: 'accent' | 'warning' | 'muted';
}

export const STATUS_LOOK: Record<DayStatus, StatusLook> = {
  done: { label: 'Fatto', icon: CircleCheck, tone: 'accent' },
  'in-progress': { label: 'In corso', icon: CirclePlay, tone: 'accent' },
  skipped: { label: 'Saltato', icon: CircleX, tone: 'warning' },
  planned: { label: 'In programma', icon: CircleDashed, tone: 'muted' },
  rest: { label: 'Riposo', icon: Moon, tone: 'muted' },
  empty: { label: '', icon: null, tone: 'muted' },
};

/** Etichetta dello stato: oggi una scheda in programma è "Da fare" */
export function statusLabel(day: DayInfo): string {
  if (day.isToday && day.status === 'planned') return 'Da fare';
  return STATUS_LOOK[day.status].label;
}

/** Cosa prevede il giorno, in breve: nome della scheda, "Riposo" o "Niente in programma" */
export function planLabel(day: DayInfo): string {
  if (day.plan.kind === 'routine') return day.plan.routine.name;
  return day.plan.kind === 'rest' ? 'Riposo' : 'Niente in programma';
}

/** Etichetta accessibile completa di un giorno: "giovedì 8 ottobre, oggi: Scheda B, fatto" */
export function dayLabel(day: DayInfo, today: string): string {
  const done = day.sessions.map((s) => s.name);
  const parts = [done.length ? done.join(' e ') : planLabel(day)];
  const status = STATUS_LOOK[day.status].label;
  if (status && day.status !== 'rest') parts.push(status.toLowerCase());
  if (day.plan.kind !== 'none' && day.plan.override) parts.push('solo per questa data');
  return `${formatLongDay(day.date, today)}${day.isToday ? ', oggi' : ''}: ${parts.join(', ')}`;
}
