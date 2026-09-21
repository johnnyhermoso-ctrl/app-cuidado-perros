export type RecurrenceFrequency = 'diaria' | 'semanal' | 'cada_2_semanas';

const MS_PER_DAY = 86_400_000;

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function isoWeekday(value: string) {
  const day = parseIsoDate(value).getUTCDay();
  return day === 0 ? 7 : day;
}

export function recurrenceAppliesOn(
  date: string,
  startDate: string,
  frequency: RecurrenceFrequency,
  weekdays: number[]
) {
  const candidate = parseIsoDate(date);
  const start = parseIsoDate(startDate);
  if (candidate < start || !weekdays.includes(isoWeekday(date))) return false;
  if (frequency !== 'cada_2_semanas') return true;
  const elapsedDays = Math.floor((candidate.getTime() - start.getTime()) / MS_PER_DAY);
  return Math.floor(elapsedDays / 7) % 2 === 0;
}

export function buildRecurrenceDates(
  startDate: string,
  endDate: string,
  frequency: RecurrenceFrequency,
  weekdays: number[]
) {
  if (!startDate || !endDate || endDate < startDate || weekdays.length === 0) return [];
  const dates: string[] = [];
  const cursor = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);
  while (cursor <= end) {
    const value = formatIsoDate(cursor);
    if (recurrenceAppliesOn(value, startDate, frequency, weekdays)) dates.push(value);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function addMonthsIso(value: string, months: number) {
  const date = parseIsoDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return formatIsoDate(date);
}

export function frequencyLabel(frequency: RecurrenceFrequency) {
  if (frequency === 'diaria') return 'Diaria';
  if (frequency === 'semanal') return 'Semanal';
  return 'Cada 2 semanas';
}
