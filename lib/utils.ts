export function formatDate(value?: string | null) {
  if (!value) return '—';
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return '—';
  return `${day}/${month}/${year}`;
}

export function calculateNights(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return 0;
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  const diff = end - start;
  if (diff <= 0) return 0;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function formatCurrency(value?: number | null, currency = 'EUR') {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value ?? 0);
}

export function isValidDateRange(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return true;
  return endDate >= startDate;
}

export function calculateBillableUnits(unitType?: string | null, startDate?: string, endDate?: string) {
  if (unitType === 'por_noche') return calculateNights(startDate, endDate);
  if (unitType === 'por_dia') return endDate ? calculateNights(startDate, endDate) + 1 : 1;
  return 1;
}

export function calculateSubtotal(rate: number, units: number, numberOfDogs: number) {
  if (rate < 0 || units < 0 || numberOfDogs < 0) return 0;
  return Math.round(rate * units * numberOfDogs * 100) / 100;
}

function timeToMinutes(value?: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

export function exceedsCheckoutGrace(arrivalTime?: string | null, departureTime?: string | null, graceHours = 2) {
  const arrival = timeToMinutes(arrivalTime);
  const departure = timeToMinutes(departureTime);
  if (arrival === null || departure === null || graceHours < 0) return false;
  return departure - arrival > graceHours * 60;
}

export function calculateBalance(total: number, payments: number[]) {
  return Math.round((total - payments.reduce((sum, payment) => sum + payment, 0)) * 100) / 100;
}
